import { GradeLetter, SemesterCourse, AcademicSemester } from '../types/schema';

/**
 * Maps numeric total marks (0-100) to standard 10-point academic Grade Letter and Grade Point.
 * Standard University Grading System:
 * - Marks >= 90: 'O' (Outstanding) -> 10 pts
 * - Marks >= 80: 'E' (Excellent)   -> 9 pts
 * - Marks >= 70: 'A' (Very Good)   -> 8 pts
 * - Marks >= 60: 'B' (Good)        -> 7 pts
 * - Marks >= 50: 'C' (Fair)        -> 6 pts
 * - Marks >= 40: 'D' (Pass)        -> 5 pts
 * - Marks < 40 : 'F' (Fail)        -> 0 pts
 */
export function calculateGrade(totalMarks: number): { gradeLetter: GradeLetter; gradePoint: number } {
  const marks = Math.max(0, Math.min(100, Math.round(totalMarks)));
  if (marks >= 90) return { gradeLetter: 'O', gradePoint: 10 };
  if (marks >= 80) return { gradeLetter: 'E', gradePoint: 9 };
  if (marks >= 70) return { gradeLetter: 'A', gradePoint: 8 };
  if (marks >= 60) return { gradeLetter: 'B', gradePoint: 7 };
  if (marks >= 50) return { gradeLetter: 'C', gradePoint: 6 };
  if (marks >= 40) return { gradeLetter: 'D', gradePoint: 5 };
  return { gradeLetter: 'F', gradePoint: 0 };
}

/**
 * Calculates Semester Grade Point Average (SGPA)
 * Formula: SGPA = Sum(Course_Credits * Course_Grade_Point) / Sum(Course_Credits)
 */
export function calculateSGPA(courses: SemesterCourse[]): {
  sgpa: number;
  totalCredits: number;
  earnedCredits: number;
} {
  if (!courses || courses.length === 0) {
    return { sgpa: 0, totalCredits: 0, earnedCredits: 0 };
  }

  let totalCreditPoints = 0;
  let totalCredits = 0;
  let earnedCredits = 0;

  for (const course of courses) {
    const credits = course.credits || 0;
    const gradePoint = course.grade_point || 0;
    
    totalCredits += credits;
    totalCreditPoints += credits * gradePoint;
    
    // Earned credits if passed (grade letter != 'F' and marks >= 40)
    if (gradePoint >= 5 && course.status !== 'Backlog') {
      earnedCredits += credits;
    }
  }

  const rawSGPA = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;
  const sgpa = Number(rawSGPA.toFixed(2));

  return { sgpa, totalCredits, earnedCredits };
}

/**
 * Calculates Cumulative Grade Point Average (CGPA)
 * Formula: CGPA = Sum(Semester_SGPA * Semester_Total_Credits) / Sum(Semester_Total_Credits)
 */
export function calculateCGPA(semesters: AcademicSemester[]): number {
  if (!semesters || semesters.length === 0) return 0;

  let totalWeightedSGPA = 0;
  let totalCreditsCount = 0;

  for (const sem of semesters) {
    if (sem.total_credits > 0 && sem.sgpa > 0) {
      totalWeightedSGPA += sem.sgpa * sem.total_credits;
      totalCreditsCount += sem.total_credits;
    }
  }

  if (totalCreditsCount === 0) return 0;
  return Number((totalWeightedSGPA / totalCreditsCount).toFixed(2));
}

/**
 * Detects whether an academic gap or drop year occurred in progression
 */
export function detectAcademicGaps(
  batchYear: number,
  semesters: AcademicSemester[]
): { hasGap: boolean; gapYears: string[]; details: string[] } {
  const gapYears: string[] = [];
  const details: string[] = [];

  // Check explicit drop flags
  for (const sem of semesters) {
    if (sem.has_drop_year) {
      gapYears.push(sem.academic_year);
      details.push(`Semester ${sem.semester_number} (${sem.academic_year}): ${sem.drop_reason || 'Academic Gap recorded'}`);
    }
  }

  // Check calendar year jumps between consecutive semesters
  const sorted = [...semesters].sort((a, b) => a.semester_number - b.semester_number);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Parse years like "2021-2022" -> 2021
    const currentYear = parseInt(current.academic_year.split('-')[0], 10);
    const nextYear = parseInt(next.academic_year.split('-')[0], 10);
    
    // Sem 1 & 2 are in year 1, Sem 3 & 4 in year 2, etc.
    const expectedYearDiff = Math.floor((next.semester_number - 1) / 2) - Math.floor((current.semester_number - 1) / 2);
    const actualYearDiff = nextYear - currentYear;
    
    if (!isNaN(actualYearDiff) && actualYearDiff > expectedYearDiff) {
      const skippedYears = actualYearDiff - expectedYearDiff;
      const note = `Detected ${skippedYears} year gap between Sem ${current.semester_number} and Sem ${next.semester_number}`;
      if (!details.includes(note)) {
        details.push(note);
      }
    }
  }

  return {
    hasGap: gapYears.length > 0 || details.length > 0,
    gapYears,
    details,
  };
}
