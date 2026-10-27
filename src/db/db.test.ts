import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGrade, calculateSGPA, calculateCGPA, detectAcademicGaps } from './calculations';
import { validateStudent, validateCourse, validateSemester } from './validation';
import { SemesterCourse, AcademicSemester } from '../types/schema';

test('Grading Engine: converts total marks to correct letter and grade points', () => {
  assert.deepEqual(calculateGrade(95), { gradeLetter: 'O', gradePoint: 10 });
  assert.deepEqual(calculateGrade(82), { gradeLetter: 'E', gradePoint: 9 });
  assert.deepEqual(calculateGrade(75), { gradeLetter: 'A', gradePoint: 8 });
  assert.deepEqual(calculateGrade(64), { gradeLetter: 'B', gradePoint: 7 });
  assert.deepEqual(calculateGrade(55), { gradeLetter: 'C', gradePoint: 6 });
  assert.deepEqual(calculateGrade(41), { gradeLetter: 'D', gradePoint: 5 });
  assert.deepEqual(calculateGrade(35), { gradeLetter: 'F', gradePoint: 0 });
});

test('SGPA Calculation: credit-weighted SGPA calculation for theory and lab courses', () => {
  const courses: SemesterCourse[] = [
    {
      course_id: 'c1',
      semester_id: 's1',
      student_id: 'stu1',
      course_code: 'CS501',
      course_name: 'Database Management Systems',
      course_type: 'Theory',
      credits: 4,
      internal_marks: 36,
      external_marks: 54,
      total_marks: 90,
      grade_letter: 'O',
      grade_point: 10,
      status: 'Passed'
    },
    {
      course_id: 'c2',
      semester_id: 's1',
      student_id: 'stu1',
      course_code: 'CS591',
      course_name: 'DBMS Laboratory',
      course_type: 'Lab',
      credits: 2,
      internal_marks: 35,
      external_marks: 49,
      total_marks: 84,
      grade_letter: 'E',
      grade_point: 9,
      status: 'Passed'
    },
    {
      course_id: 'c3',
      semester_id: 's1',
      student_id: 'stu1',
      course_code: 'CS502',
      course_name: 'Operating Systems',
      course_type: 'Theory',
      credits: 4,
      internal_marks: 30,
      external_marks: 42,
      total_marks: 72,
      grade_letter: 'A',
      grade_point: 8,
      status: 'Passed'
    }
  ];

  // Total credits = 4 + 2 + 4 = 10
  // Credit points = (4*10) + (2*9) + (4*8) = 40 + 18 + 32 = 90
  // SGPA = 90 / 10 = 9.00
  const result = calculateSGPA(courses);
  assert.equal(result.sgpa, 9.00);
  assert.equal(result.totalCredits, 10);
  assert.equal(result.earnedCredits, 10);
});

test('CGPA Calculation: weighted average across semesters', () => {
  const semesters: AcademicSemester[] = [
    {
      semester_id: 's1',
      student_id: 'stu1',
      semester_number: 1,
      academic_year: '2021-2022',
      sgpa: 8.50,
      cgpa: 8.50,
      total_credits: 20,
      earned_credits: 20,
      has_drop_year: false
    },
    {
      semester_id: 's2',
      student_id: 'stu1',
      semester_number: 2,
      academic_year: '2021-2022',
      sgpa: 9.00,
      cgpa: 8.75,
      total_credits: 20,
      earned_credits: 20,
      has_drop_year: false
    }
  ];

  // (8.50*20 + 9.00*20) / 40 = 350 / 40 = 8.75
  const cgpa = calculateCGPA(semesters);
  assert.equal(cgpa, 8.75);
});

test('Academic Gap & Drop Year Detection: flags explicit drop years and calendar gaps', () => {
  const normalSemesters: AcademicSemester[] = [
    { semester_id: '1', student_id: 's1', semester_number: 1, academic_year: '2021-2022', sgpa: 8.0, cgpa: 8.0, total_credits: 20, earned_credits: 20, has_drop_year: false },
    { semester_id: '2', student_id: 's1', semester_number: 2, academic_year: '2021-2022', sgpa: 8.2, cgpa: 8.1, total_credits: 20, earned_credits: 20, has_drop_year: false },
    { semester_id: '3', student_id: 's1', semester_number: 3, academic_year: '2022-2023', sgpa: 8.4, cgpa: 8.2, total_credits: 20, earned_credits: 20, has_drop_year: false }
  ];
  assert.equal(detectAcademicGaps(2021, normalSemesters).hasGap, false);

  const dropSemesters: AcademicSemester[] = [
    { semester_id: '1', student_id: 's2', semester_number: 1, academic_year: '2020-2021', sgpa: 7.8, cgpa: 7.8, total_credits: 20, earned_credits: 20, has_drop_year: false },
    { semester_id: '2', student_id: 's2', semester_number: 2, academic_year: '2020-2021', sgpa: 7.5, cgpa: 7.65, total_credits: 20, earned_credits: 20, has_drop_year: false },
    { semester_id: '3', student_id: 's2', semester_number: 3, academic_year: '2022-2023', sgpa: 8.5, cgpa: 7.93, total_credits: 20, earned_credits: 20, has_drop_year: true, drop_reason: 'Medical Leave' }
  ];
  const dropResult = detectAcademicGaps(2020, dropSemesters);
  assert.equal(dropResult.hasGap, true);
  assert.ok(dropResult.gapYears.includes('2022-2023'));
});

test('Schema Constraints Enforcement: catches invalid marks, percentages, and semester numbers', () => {
  // Negative percentage
  const studentErrors = validateStudent({
    roll_no: '2021CSE01',
    full_name: 'Test Student',
    email: '101@viva-technology.org',
    secondary_percentage: 105, // invalid
    current_semester: 9 // invalid
  });
  assert.equal(studentErrors.length, 2);
  assert.equal(studentErrors[0].constraint, 'CHECK_SEMESTER_RANGE');
  assert.equal(studentErrors[1].constraint, 'CHECK_PERCENTAGE_RANGE');

  // Course mark bounds check
  const courseErrors = validateCourse({
    course_code: 'CS501',
    course_name: 'DBMS',
    internal_marks: 45, // invalid (> 40)
    external_marks: 65, // invalid (> 60)
    credits: 0 // invalid (<= 0)
  });
  assert.equal(courseErrors.length, 3);
  assert.ok(courseErrors.some(e => e.constraint === 'CHECK_CREDITS_RANGE'));
  assert.ok(courseErrors.some(e => e.constraint === 'CHECK_INTERNAL_MARKS_RANGE'));
  assert.ok(courseErrors.some(e => e.constraint === 'CHECK_EXTERNAL_MARKS_RANGE'));
});

test('Schema Constraints: Enforce strict @viva-technology.org institutional email requirement', () => {
  // Reject non-viva domain emails
  const invalidDomainStudent = validateStudent({
    roll_no: '2021CSE02',
    full_name: 'External Student',
    email: 'student@gmail.com',
  });
  assert.ok(invalidDomainStudent.some(e => e.constraint === 'CHECK_VIVA_EMAIL_DOMAIN'));

  const invalidLegacyStudent = validateStudent({
    roll_no: '2021CSE03',
    full_name: 'Old Student',
    email: 'student@scholarpulse.edu',
  });
  assert.ok(invalidLegacyStudent.some(e => e.constraint === 'CHECK_VIVA_EMAIL_DOMAIN'));

  // Accept valid viva-technology.org emails
  const validNumericStudent = validateStudent({
    roll_no: '2021CSE04',
    full_name: 'Viva Tech Student',
    email: '123@viva-technology.org',
  });
  assert.equal(validNumericStudent.filter(e => e.field === 'email').length, 0);

  const validAlphaStudent = validateStudent({
    roll_no: '2021CSE05',
    full_name: 'Viva Tech Student 2',
    email: '2021cse05@viva-technology.org',
  });
  assert.equal(validAlphaStudent.filter(e => e.field === 'email').length, 0);
});

test('Cohort Integrity: At least 100 students seeded, all with valid @viva-technology.org emails and zero schema violations', async () => {
  const { INITIAL_STUDENTS } = await import('./seedData');
  assert.ok(INITIAL_STUDENTS.length >= 100, `Expected at least 100 students, found ${INITIAL_STUDENTS.length}`);

  for (const student of INITIAL_STUDENTS) {
    const errors = validateStudent(student);
    assert.equal(errors.length, 0, `Validation errors for student ${student.roll_no}: ${JSON.stringify(errors)}`);
    assert.ok(student.email.endsWith('@viva-technology.org'), `Email ${student.email} must end with @viva-technology.org`);
  }
});


