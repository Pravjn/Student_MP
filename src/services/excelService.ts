import * as XLSX from 'xlsx';
import { db } from '../db/relationalStore';
import { Student, AcademicSemester, SemesterCourse, StudentSeminar, StudentActivity, AcademicGapRecord } from '../types/schema';
import { validateStudent, validateCourse, validateSemester } from '../db/validation';

/**
 * Generates and downloads a complete Excel (.xlsx) file with all 3NF relational tables and Data Dictionary
 */
export function exportDatabaseToExcel(filename: string = 'ScholarPulse_DBMS_Student_Progression.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. Students_Profile
  const students = db.getStudents().map((s) => ({
    'Student ID': s.student_id,
    'Roll Number': s.roll_no,
    'Full Name': s.full_name,
    'Email Address': s.email,
    'Phone': s.phone,
    'Department': s.department,
    'Batch Year': s.batch_year,
    'Current Semester': s.current_semester,
    'Academic Status': s.status,
    '10th Board': s.secondary_board,
    '10th Percentage': s.secondary_percentage,
    '10th Pass Year': s.secondary_passing_year,
    '12th Board': s.higher_sec_board,
    '12th Percentage': s.higher_sec_percentage,
    '12th Stream': s.higher_sec_stream,
    '12th Pass Year': s.higher_sec_passing_year,
  }));
  const wsStudents = XLSX.utils.json_to_sheet(students);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Students_Profile');

  // 2. Semester_Progression
  const semesters = db.getAllSemesters().map((s) => ({
    'Semester ID': s.semester_id,
    'Student ID': s.student_id,
    'Semester Number': s.semester_number,
    'Academic Year': s.academic_year,
    'SGPA': s.sgpa,
    'CGPA': s.cgpa,
    'Total Credits': s.total_credits,
    'Earned Credits': s.earned_credits,
    'Drop Year Flag': s.has_drop_year ? 'YES' : 'NO',
    'Drop Reason': s.drop_reason || '',
  }));
  const wsSemesters = XLSX.utils.json_to_sheet(semesters);
  XLSX.utils.book_append_sheet(wb, wsSemesters, 'Semester_Progression');

  // 3. Theory_Lab_Marks
  const courses = db.getAllCourses().map((c) => ({
    'Course ID': c.course_id,
    'Semester ID': c.semester_id,
    'Student ID': c.student_id,
    'Course Code': c.course_code,
    'Course Name': c.course_name,
    'Course Type': c.course_type,
    'Credits': c.credits,
    'Internal Marks (out of 40)': c.internal_marks,
    'External Marks (out of 60)': c.external_marks,
    'Total Marks (out of 100)': c.total_marks,
    'Grade Letter': c.grade_letter,
    'Grade Point': c.grade_point,
    'Course Status': c.status,
  }));
  const wsCourses = XLSX.utils.json_to_sheet(courses);
  XLSX.utils.book_append_sheet(wb, wsCourses, 'Theory_Lab_Marks');

  // 4. Seminars_Portfolio
  const seminars = db.getSeminars().map((s) => ({
    'Seminar ID': s.seminar_id,
    'Student ID': s.student_id,
    'Classification': s.seminar_type,
    'Title / Topic': s.title,
    'Venue / Organizer': s.venue_or_organizer,
    'Date Conducted': s.date_conducted,
    'Role': s.role,
    'Certificate Ref': s.certificate_ref || '',
    'Remarks': s.remarks || '',
  }));
  const wsSeminars = XLSX.utils.json_to_sheet(seminars);
  XLSX.utils.book_append_sheet(wb, wsSeminars, 'Seminars_Portfolio');

  // 5. Activities_Portfolio
  const activities = db.getActivities().map((a) => ({
    'Activity ID': a.activity_id,
    'Student ID': a.student_id,
    'Activity Group': a.activity_class,
    'Category': a.category,
    'Event Name': a.event_name,
    'Achievement / Award': a.achievement_or_award,
    'Event Date': a.event_date,
    'Organizer': a.organizer,
    'Impact Points': a.impact_points,
    'Certificate Ref': a.certificate_ref || '',
  }));
  const wsActivities = XLSX.utils.json_to_sheet(activities);
  XLSX.utils.book_append_sheet(wb, wsActivities, 'Activities_Portfolio');

  // 6. Academic_Gap_Years
  const gaps = db.getGaps().map((g) => ({
    'Gap ID': g.gap_id,
    'Student ID': g.student_id,
    'Gap Classification': g.gap_type,
    'Academic Year Affected': g.academic_year_affected,
    'Duration (Years)': g.duration_years,
    'Reason & Justification': g.reason,
    'Approved By': g.approved_by,
    'Clearance Status': g.clearance_status,
  }));
  const wsGaps = XLSX.utils.json_to_sheet(gaps);
  XLSX.utils.book_append_sheet(wb, wsGaps, 'Academic_Gap_Years');

  // 7. Schema Data Dictionary & Constraints Report
  const dictionary = [
    {
      'Table Name': 'students',
      'Column': 'student_id',
      'Data Type': 'VARCHAR(64)',
      'Constraint': 'PRIMARY KEY',
      'Description': 'Unique identifier for student record',
    },
    {
      'Table Name': 'students',
      'Column': 'roll_no',
      'Data Type': 'VARCHAR(32)',
      'Constraint': 'UNIQUE NOT NULL',
      'Description': 'University Registration / Roll Number',
    },
    {
      'Table Name': 'students',
      'Column': 'secondary_percentage',
      'Data Type': 'NUMERIC(5,2)',
      'Constraint': 'CHECK (secondary_percentage BETWEEN 0 AND 100)',
      'Description': 'Secondary 10th grade percentage score',
    },
    {
      'Table Name': 'academic_semesters',
      'Column': 'student_id',
      'Data Type': 'VARCHAR(64)',
      'Constraint': 'FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE',
      'Description': 'Cascading foreign key reference to student profile',
    },
    {
      'Table Name': 'academic_semesters',
      'Column': 'sgpa',
      'Data Type': 'NUMERIC(4,2)',
      'Constraint': 'CHECK (sgpa BETWEEN 0 AND 10)',
      'Description': 'Semester Grade Point Average (0.00 to 10.00)',
    },
    {
      'Table Name': 'semester_courses',
      'Column': 'internal_marks',
      'Data Type': 'NUMERIC(5,2)',
      'Constraint': 'CHECK (internal_marks BETWEEN 0 AND 40)',
      'Description': 'Internal continuous assessment marks',
    },
    {
      'Table Name': 'semester_courses',
      'Column': 'external_marks',
      'Data Type': 'NUMERIC(5,2)',
      'Constraint': 'CHECK (external_marks BETWEEN 0 AND 60)',
      'Description': 'End-semester university exam marks',
    },
    {
      'Table Name': 'semester_courses',
      'Column': 'total_marks',
      'Data Type': 'NUMERIC(5,2)',
      'Constraint': 'CHECK (total_marks BETWEEN 0 AND 100)',
      'Description': 'Sum of internal and external marks',
    },
    {
      'Table Name': 'student_seminars',
      'Column': 'seminar_type',
      'Data Type': 'VARCHAR(16)',
      'Constraint': "CHECK (seminar_type IN ('INTERNAL', 'EXTERNAL'))",
      'Description': 'Segregated seminar portfolio classification',
    },
    {
      'Table Name': 'student_activities',
      'Column': 'activity_class',
      'Data Type': 'VARCHAR(32)',
      'Constraint': "CHECK (activity_class IN ('TECHNICAL_CO_CURRICULAR', 'EXTRA_CURRICULAR'))",
      'Description': 'Segregated activity portfolio classification',
    },
  ];
  const wsDict = XLSX.utils.json_to_sheet(dictionary);
  XLSX.utils.book_append_sheet(wb, wsDict, 'Data_Dictionary_3NF');

  // Trigger download in browser
  XLSX.writeFile(wb, filename);
}

/**
 * Parses an uploaded Excel (.xlsx) file and validates 3NF constraints before committing
 */
export async function importDatabaseFromExcel(file: File): Promise<{
  success: boolean;
  importedCounts: { students: number; courses: number; seminars: number; activities: number };
  errors: string[];
}> {
  const errors: string[] = [];
  let studentsCount = 0;
  let coursesCount = 0;
  let seminarsCount = 0;
  let activitiesCount = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Read Students_Profile
    if (wb.SheetNames.includes('Students_Profile')) {
      const sheet = wb.Sheets['Students_Profile'];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      for (const row of rows) {
        const studentObj: Partial<Student> = {
          student_id: row['Student ID'] || `stu-import-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          roll_no: String(row['Roll Number'] || '').trim(),
          full_name: String(row['Full Name'] || '').trim(),
          email: String(row['Email Address'] || row['Email'] || '').trim(),
          phone: String(row['Phone'] || ''),
          department: String(row['Department'] || 'General Engineering'),
          batch_year: Number(row['Batch Year']) || 2022,
          current_semester: Number(row['Current Semester']) || 1,
          status: row['Academic Status'] || 'Active',
          secondary_board: String(row['10th Board'] || 'CBSE'),
          secondary_percentage: Number(row['10th Percentage']) || 0,
          secondary_passing_year: Number(row['10th Pass Year']) || 2020,
          higher_sec_board: String(row['12th Board'] || 'CBSE'),
          higher_sec_percentage: Number(row['12th Percentage']) || 0,
          higher_sec_stream: String(row['12th Stream'] || 'Science'),
          higher_sec_passing_year: Number(row['12th Pass Year']) || 2022,
        };

        const valErrors = validateStudent(studentObj);
        if (valErrors.length > 0) {
          errors.push(`Row ${studentObj.roll_no || 'unknown'}: ${valErrors.map((e) => e.message).join(', ')}`);
        } else {
          try {
            db.upsertStudent(studentObj);
            studentsCount++;
          } catch (e: any) {
            errors.push(`Student ${studentObj.roll_no}: ${e.message}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      importedCounts: {
        students: studentsCount,
        courses: coursesCount,
        seminars: seminarsCount,
        activities: activitiesCount,
      },
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCounts: { students: 0, courses: 0, seminars: 0, activities: 0 },
      errors: [err.message || 'Failed to parse Excel file'],
    };
  }
}
