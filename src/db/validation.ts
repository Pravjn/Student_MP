import { Student, AcademicSemester, SemesterCourse, StudentSeminar, StudentActivity, AcademicGapRecord } from '../types/schema';

export interface ValidationError {
  field: string;
  constraint: string; // e.g. "CHECK_MARKS_RANGE", "FOREIGN_KEY_NOT_FOUND"
  message: string;
}

export class SchemaConstraintException extends Error {
  public errors: ValidationError[];
  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'SchemaConstraintException';
    this.errors = errors;
  }
}

/**
 * Validates Student entity against relational schema constraints
 */
export function validateStudent(student: Partial<Student>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!student.roll_no || student.roll_no.trim() === '') {
    errors.push({ field: 'roll_no', constraint: 'NOT_NULL', message: 'Roll number cannot be empty.' });
  }

  if (!student.full_name || student.full_name.trim() === '') {
    errors.push({ field: 'full_name', constraint: 'NOT_NULL', message: 'Student full name cannot be empty.' });
  }

  const email = (student.email || '').trim();
  const vivaEmailRegex = /^[a-zA-Z0-9._%+-]+@viva-technology\.org$/i;
  if (!email || !vivaEmailRegex.test(email)) {
    errors.push({
      field: 'email',
      constraint: 'CHECK_VIVA_EMAIL_DOMAIN',
      message: 'Email must strictly be an institutional address ending in @viva-technology.org (e.g. 123@viva-technology.org).'
    });
  }

  if (student.current_semester !== undefined) {
    if (student.current_semester < 1 || student.current_semester > 8) {
      errors.push({
        field: 'current_semester',
        constraint: 'CHECK_SEMESTER_RANGE',
        message: 'Current semester must be between 1 and 8.'
      });
    }
  }

  if (student.secondary_percentage !== undefined) {
    if (student.secondary_percentage < 0 || student.secondary_percentage > 100) {
      errors.push({
        field: 'secondary_percentage',
        constraint: 'CHECK_PERCENTAGE_RANGE',
        message: 'Secondary 10th marks percentage must be between 0% and 100%.'
      });
    }
  }

  if (student.higher_sec_percentage !== undefined) {
    if (student.higher_sec_percentage < 0 || student.higher_sec_percentage > 100) {
      errors.push({
        field: 'higher_sec_percentage',
        constraint: 'CHECK_PERCENTAGE_RANGE',
        message: 'Higher Secondary 12th marks percentage must be between 0% and 100%.'
      });
    }
  }

  return errors;
}

/**
 * Validates SemesterCourse entity against relational schema constraints
 */
export function validateCourse(
  course: Partial<SemesterCourse>,
  existingSemesterIds?: Set<string>,
  existingStudentIds?: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (existingStudentIds && course.student_id && !existingStudentIds.has(course.student_id)) {
    errors.push({
      field: 'student_id',
      constraint: 'FOREIGN_KEY_VIOLATION',
      message: `Referenced student_id '${course.student_id}' does not exist.`
    });
  }

  if (existingSemesterIds && course.semester_id && !existingSemesterIds.has(course.semester_id)) {
    errors.push({
      field: 'semester_id',
      constraint: 'FOREIGN_KEY_VIOLATION',
      message: `Referenced semester_id '${course.semester_id}' does not exist.`
    });
  }

  if (!course.course_code || course.course_code.trim() === '') {
    errors.push({ field: 'course_code', constraint: 'NOT_NULL', message: 'Course Code is required (e.g. CS501).' });
  }

  if (!course.course_name || course.course_name.trim() === '') {
    errors.push({ field: 'course_name', constraint: 'NOT_NULL', message: 'Course Name is required.' });
  }

  if (course.credits !== undefined) {
    if (course.credits <= 0 || course.credits > 10) {
      errors.push({
        field: 'credits',
        constraint: 'CHECK_CREDITS_RANGE',
        message: 'Credits must be strictly greater than 0 and at most 10.'
      });
    }
  }

  if (course.internal_marks !== undefined) {
    if (course.internal_marks < 0 || course.internal_marks > 40) {
      errors.push({
        field: 'internal_marks',
        constraint: 'CHECK_INTERNAL_MARKS_RANGE',
        message: 'Internal marks must be between 0 and 40.'
      });
    }
  }

  if (course.external_marks !== undefined) {
    if (course.external_marks < 0 || course.external_marks > 60) {
      errors.push({
        field: 'external_marks',
        constraint: 'CHECK_EXTERNAL_MARKS_RANGE',
        message: 'External semester examination marks must be between 0 and 60.'
      });
    }
  }

  if (course.total_marks !== undefined) {
    if (course.total_marks < 0 || course.total_marks > 100) {
      errors.push({
        field: 'total_marks',
        constraint: 'CHECK_TOTAL_MARKS_RANGE',
        message: 'Total course marks must be between 0 and 100.'
      });
    }
  }

  return errors;
}

/**
 * Validates AcademicSemester entity
 */
export function validateSemester(
  sem: Partial<AcademicSemester>,
  existingStudentIds?: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (existingStudentIds && sem.student_id && !existingStudentIds.has(sem.student_id)) {
    errors.push({
      field: 'student_id',
      constraint: 'FOREIGN_KEY_VIOLATION',
      message: `Foreign key constraint failed: student_id '${sem.student_id}' does not exist.`
    });
  }

  if (sem.semester_number !== undefined) {
    if (sem.semester_number < 1 || sem.semester_number > 8) {
      errors.push({
        field: 'semester_number',
        constraint: 'CHECK_SEMESTER_RANGE',
        message: 'Semester number must be between 1 and 8.'
      });
    }
  }

  if (sem.sgpa !== undefined) {
    if (sem.sgpa < 0 || sem.sgpa > 10) {
      errors.push({
        field: 'sgpa',
        constraint: 'CHECK_SGPA_RANGE',
        message: 'SGPA must be between 0.00 and 10.00.'
      });
    }
  }

  if (sem.cgpa !== undefined) {
    if (sem.cgpa < 0 || sem.cgpa > 10) {
      errors.push({
        field: 'cgpa',
        constraint: 'CHECK_CGPA_RANGE',
        message: 'CGPA must be between 0.00 and 10.00.'
      });
    }
  }

  return errors;
}

/**
 * Validates StudentSeminar entity
 */
export function validateSeminar(
  seminar: Partial<StudentSeminar>,
  existingStudentIds?: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (existingStudentIds && seminar.student_id && !existingStudentIds.has(seminar.student_id)) {
    errors.push({
      field: 'student_id',
      constraint: 'FOREIGN_KEY_VIOLATION',
      message: `Foreign key constraint failed: student_id '${seminar.student_id}' not found.`
    });
  }

  if (!seminar.title || seminar.title.trim() === '') {
    errors.push({ field: 'title', constraint: 'NOT_NULL', message: 'Seminar Title is required.' });
  }

  if (!seminar.seminar_type || !['INTERNAL', 'EXTERNAL'].includes(seminar.seminar_type)) {
    errors.push({
      field: 'seminar_type',
      constraint: 'CHECK_SEMINAR_TYPE',
      message: "Seminar Type must be either 'INTERNAL' or 'EXTERNAL'."
    });
  }

  return errors;
}

/**
 * Validates StudentActivity entity
 */
export function validateActivity(
  activity: Partial<StudentActivity>,
  existingStudentIds?: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (existingStudentIds && activity.student_id && !existingStudentIds.has(activity.student_id)) {
    errors.push({
      field: 'student_id',
      constraint: 'FOREIGN_KEY_VIOLATION',
      message: `Foreign key constraint failed: student_id '${activity.student_id}' not found.`
    });
  }

  if (!activity.event_name || activity.event_name.trim() === '') {
    errors.push({ field: 'event_name', constraint: 'NOT_NULL', message: 'Activity event name is required.' });
  }

  if (activity.impact_points !== undefined && activity.impact_points < 0) {
    errors.push({
      field: 'impact_points',
      constraint: 'CHECK_NON_NEGATIVE',
      message: 'Impact points must be non-negative (>= 0).'
    });
  }

  return errors;
}
