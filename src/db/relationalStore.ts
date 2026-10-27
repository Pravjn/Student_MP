import {
  Student,
  AcademicSemester,
  SemesterCourse,
  StudentSeminar,
  StudentActivity,
  AcademicGapRecord,
  SyncLogEntry,
  GoogleSheetsConfig
} from '../types/schema';
import {
  INITIAL_STUDENTS,
  INITIAL_SEMESTERS,
  INITIAL_COURSES,
  INITIAL_SEMINARS,
  INITIAL_ACTIVITIES,
  INITIAL_GAPS,
  INITIAL_SYNC_LOGS
} from './seedData';
import { calculateGrade, calculateSGPA, calculateCGPA } from './calculations';
import {
  validateStudent,
  validateCourse,
  validateSemester,
  validateSeminar,
  validateActivity,
  SchemaConstraintException
} from './validation';

const STORAGE_KEY_STUDENTS = 'scholarpulse_db_students_v1';
const STORAGE_KEY_SEMESTERS = 'scholarpulse_db_semesters_v1';
const STORAGE_KEY_COURSES = 'scholarpulse_db_courses_v1';
const STORAGE_KEY_SEMINARS = 'scholarpulse_db_seminars_v1';
const STORAGE_KEY_ACTIVITIES = 'scholarpulse_db_activities_v1';
const STORAGE_KEY_GAPS = 'scholarpulse_db_gaps_v1';
const STORAGE_KEY_LOGS = 'scholarpulse_db_logs_v1';
const STORAGE_KEY_SHEETS_CONFIG = 'scholarpulse_db_sheets_config_v1';

export class RelationalDatabase {
  private students: Map<string, Student> = new Map();
  private semesters: Map<string, AcademicSemester> = new Map();
  private courses: Map<string, SemesterCourse> = new Map();
  private seminars: Map<string, StudentSeminar> = new Map();
  private activities: Map<string, StudentActivity> = new Map();
  private gaps: Map<string, AcademicGapRecord> = new Map();
  private logs: SyncLogEntry[] = [];
  private sheetsConfig: GoogleSheetsConfig = {
    spreadsheetId: '19XXyjrxBRNKlS7xUTZ-fEMVgbNqkYq-nRthhTlGUNwQ',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/19XXyjrxBRNKlS7xUTZ-fEMVgbNqkYq-nRthhTlGUNwQ/edit',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzf76sqJbreqsxi7HHBam0oBtdPkV-e_vWNxEcqzR2yVb9VV2zJdbFfWZeUPY3Fv9E/exec',
    connectionMode: 'APPS_SCRIPT',
    title: 'Shridhar_Singh_DBMS',
    lastSyncedAt: new Date().toISOString(),
    autoSync: true,
  };

  private listeners: Set<() => void> = new Set();
  private onMutationCallback: ((action: string, entity: string, details: string) => void) | null = null;
  private autoSyncDebounceTimer: any = null;

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setMutationCallback(cb: (action: string, entity: string, details: string) => void) {
    this.onMutationCallback = cb;
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((fn) => fn());

    // Continuous 1-Way parity: automatically sync mutations to connected Google Sheet
    if (typeof window !== 'undefined' && this.sheetsConfig.webAppUrl && this.sheetsConfig.autoSync) {
      if (this.autoSyncDebounceTimer) clearTimeout(this.autoSyncDebounceTimer);
      this.autoSyncDebounceTimer = setTimeout(() => {
        import('../services/appsScriptTemplate').then(({ syncDatabaseViaAppsScript }) => {
          if (this.sheetsConfig.webAppUrl) {
            syncDatabaseViaAppsScript(this.sheetsConfig.webAppUrl).catch(() => {});
          }
        }).catch(() => {});
      }, 2500);
    }
  }

  private logAction(
    action: SyncLogEntry['action'],
    entity: SyncLogEntry['entity'],
    target: SyncLogEntry['target'],
    details: string,
    status: SyncLogEntry['status'] = 'SUCCESS'
  ) {
    const entry: SyncLogEntry = {
      log_id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      action,
      entity,
      target,
      status,
      details,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();

    if (this.onMutationCallback) {
      this.onMutationCallback(action, entity, details);
    }
  }

  private saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(Array.from(this.students.values())));
        localStorage.setItem(STORAGE_KEY_SEMESTERS, JSON.stringify(Array.from(this.semesters.values())));
        localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(Array.from(this.courses.values())));
        localStorage.setItem(STORAGE_KEY_SEMINARS, JSON.stringify(Array.from(this.seminars.values())));
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(Array.from(this.activities.values())));
        localStorage.setItem(STORAGE_KEY_GAPS, JSON.stringify(Array.from(this.gaps.values())));
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
        localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(this.sheetsConfig));
      }
    } catch {
      // Storage unavailable or quota limit handled gracefully
    }
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') {
        this.resetToSeedData();
        return;
      }

      const stuRaw = localStorage.getItem(STORAGE_KEY_STUDENTS);
      const semRaw = localStorage.getItem(STORAGE_KEY_SEMESTERS);
      const couRaw = localStorage.getItem(STORAGE_KEY_COURSES);
      const semInRaw = localStorage.getItem(STORAGE_KEY_SEMINARS);
      const actRaw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      const gapRaw = localStorage.getItem(STORAGE_KEY_GAPS);
      const logRaw = localStorage.getItem(STORAGE_KEY_LOGS);
      const cfgRaw = localStorage.getItem(STORAGE_KEY_SHEETS_CONFIG);

      if (stuRaw && semRaw && couRaw) {
        const loadedStudents: Student[] = JSON.parse(stuRaw);
        // Reseed if fewer than 100 students or legacy email domain detected
        const hasLegacyEmails = loadedStudents.some((s) => !s.email?.endsWith('@viva-technology.org'));
        if (loadedStudents.length < 100 || hasLegacyEmails) {
          this.resetToSeedData();
          return;
        }

        loadedStudents.forEach((s: Student) => this.students.set(s.student_id, s));
        JSON.parse(semRaw).forEach((s: AcademicSemester) => this.semesters.set(s.semester_id, s));
        JSON.parse(couRaw).forEach((c: SemesterCourse) => this.courses.set(c.course_id, c));
        if (semInRaw) JSON.parse(semInRaw).forEach((s: StudentSeminar) => this.seminars.set(s.seminar_id, s));
        if (actRaw) JSON.parse(actRaw).forEach((a: StudentActivity) => this.activities.set(a.activity_id, a));
        if (gapRaw) JSON.parse(gapRaw).forEach((g: AcademicGapRecord) => this.gaps.set(g.gap_id, g));
        if (logRaw) this.logs = JSON.parse(logRaw);
        if (cfgRaw) this.sheetsConfig = { ...this.sheetsConfig, ...JSON.parse(cfgRaw) };

        if (!this.sheetsConfig.webAppUrl) {
          this.sheetsConfig.webAppUrl = 'https://script.google.com/macros/s/AKfycbzf76sqJbreqsxi7HHBam0oBtdPkV-e_vWNxEcqzR2yVb9VV2zJdbFfWZeUPY3Fv9E/exec';
          this.sheetsConfig.spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/19XXyjrxBRNKlS7xUTZ-fEMVgbNqkYq-nRthhTlGUNwQ/edit';
          this.sheetsConfig.spreadsheetId = '19XXyjrxBRNKlS7xUTZ-fEMVgbNqkYq-nRthhTlGUNwQ';
          this.sheetsConfig.title = 'Shridhar_Singh_DBMS';
        }
        return;
      }
    } catch {
      // Storage load fallback
    }

    this.resetToSeedData();
  }

  public resetToSeedData() {
    this.students.clear();
    this.semesters.clear();
    this.courses.clear();
    this.seminars.clear();
    this.activities.clear();
    this.gaps.clear();

    INITIAL_STUDENTS.forEach((s) => this.students.set(s.student_id, s));
    INITIAL_SEMESTERS.forEach((s) => this.semesters.set(s.semester_id, s));
    INITIAL_COURSES.forEach((c) => this.courses.set(c.course_id, c));
    INITIAL_SEMINARS.forEach((s) => this.seminars.set(s.seminar_id, s));
    INITIAL_ACTIVITIES.forEach((a) => this.activities.set(a.activity_id, a));
    INITIAL_GAPS.forEach((g) => this.gaps.set(g.gap_id, g));
    this.logs = [...INITIAL_SYNC_LOGS];

    this.saveToStorage();
    this.notify();
  }

  // --- GETTERS ---
  public getStudents(): Student[] {
    return Array.from(this.students.values());
  }

  public getStudent(studentId: string): Student | undefined {
    return this.students.get(studentId);
  }

  public getSemesters(studentId: string): AcademicSemester[] {
    return Array.from(this.semesters.values())
      .filter((s) => s.student_id === studentId)
      .sort((a, b) => a.semester_number - b.semester_number);
  }

  public getAllSemesters(): AcademicSemester[] {
    return Array.from(this.semesters.values());
  }

  public getCourses(semesterId: string): SemesterCourse[] {
    return Array.from(this.courses.values()).filter((c) => c.semester_id === semesterId);
  }

  public getAllCourses(): SemesterCourse[] {
    return Array.from(this.courses.values());
  }

  public getSeminars(studentId?: string): StudentSeminar[] {
    const list = Array.from(this.seminars.values());
    if (studentId) return list.filter((s) => s.student_id === studentId);
    return list;
  }

  public getActivities(studentId?: string): StudentActivity[] {
    const list = Array.from(this.activities.values());
    if (studentId) return list.filter((a) => a.student_id === studentId);
    return list;
  }

  public getGaps(studentId?: string): AcademicGapRecord[] {
    const list = Array.from(this.gaps.values());
    if (studentId) return list.filter((g) => g.student_id === studentId);
    return list;
  }

  public getLogs(): SyncLogEntry[] {
    return [...this.logs];
  }

  public getSheetsConfig(): GoogleSheetsConfig {
    return { ...this.sheetsConfig };
  }

  public setSheetsConfig(cfg: Partial<GoogleSheetsConfig>) {
    this.sheetsConfig = { ...this.sheetsConfig, ...cfg };
    this.notify();
  }

  // --- CRUD: STUDENTS ---
  public upsertStudent(data: Partial<Student>): Student {
    const errors = validateStudent(data);
    if (errors.length > 0) {
      throw new SchemaConstraintException('Constraint violation while validating student', errors);
    }

    const isEdit = !!data.student_id && this.students.has(data.student_id);
    const student_id = data.student_id || 'stu-' + Date.now();
    const now = new Date().toISOString();

    // Check unique roll number
    for (const [id, st] of this.students) {
      if (id !== student_id && st.roll_no.toLowerCase() === data.roll_no?.toLowerCase()) {
        throw new SchemaConstraintException('Unique constraint violation', [
          { field: 'roll_no', constraint: 'UNIQUE', message: `Roll number '${data.roll_no}' already exists.` }
        ]);
      }
    }

    const student: Student = {
      student_id,
      roll_no: data.roll_no || 'TEMP001',
      full_name: data.full_name || 'Unnamed Student',
      email: data.email || 'student@domain.edu',
      phone: data.phone || '',
      department: data.department || 'Computer Science & Engineering',
      batch_year: data.batch_year || new Date().getFullYear(),
      current_semester: data.current_semester || 1,
      status: data.status || 'Active',
      secondary_board: data.secondary_board || 'CBSE',
      secondary_percentage: data.secondary_percentage || 0,
      secondary_passing_year: data.secondary_passing_year || 2019,
      higher_sec_board: data.higher_sec_board || 'CBSE',
      higher_sec_percentage: data.higher_sec_percentage || 0,
      higher_sec_stream: data.higher_sec_stream || 'Science (PCM)',
      higher_sec_passing_year: data.higher_sec_passing_year || 2021,
      created_at: isEdit ? this.students.get(student_id)!.created_at : now,
      updated_at: now,
    };

    this.students.set(student_id, student);

    // If new student, generate default empty semesters 1 to current_semester
    if (!isEdit) {
      for (let i = 1; i <= Math.min(8, Math.max(1, student.current_semester)); i++) {
        const semId = `sem-${student_id}-${i}`;
        const semYear = `${student.batch_year + Math.floor((i - 1) / 2)}-${student.batch_year + Math.floor((i - 1) / 2) + 1}`;
        this.semesters.set(semId, {
          semester_id: semId,
          student_id,
          semester_number: i,
          academic_year: semYear,
          sgpa: 0,
          cgpa: 0,
          total_credits: 0,
          earned_credits: 0,
          has_drop_year: false,
        });
      }
    }

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'STUDENT',
      'LOCAL_DB',
      `${isEdit ? 'Updated' : 'Inserted'} student ${student.full_name} (${student.roll_no})`
    );

    this.notify();
    return student;
  }

  /**
   * Delete student with FOREIGN KEY ON DELETE CASCADE
   */
  public deleteStudent(studentId: string): boolean {
    const student = this.students.get(studentId);
    if (!student) return false;

    // 1. Cascade delete courses belonging to student
    for (const [cId, course] of this.courses) {
      if (course.student_id === studentId) {
        this.courses.delete(cId);
      }
    }

    // 2. Cascade delete semesters belonging to student
    for (const [sId, sem] of this.semesters) {
      if (sem.student_id === studentId) {
        this.semesters.delete(sId);
      }
    }

    // 3. Cascade delete seminars
    for (const [semInId, seminar] of this.seminars) {
      if (seminar.student_id === studentId) {
        this.seminars.delete(semInId);
      }
    }

    // 4. Cascade delete activities
    for (const [actId, act] of this.activities) {
      if (act.student_id === studentId) {
        this.activities.delete(actId);
      }
    }

    // 5. Cascade delete gap records
    for (const [gapId, gap] of this.gaps) {
      if (gap.student_id === studentId) {
        this.gaps.delete(gapId);
      }
    }

    // 6. Delete parent student record
    this.students.delete(studentId);

    this.logAction(
      'DELETE',
      'STUDENT',
      'LOCAL_DB',
      `Cascade deleted student ${student.full_name} (${student.roll_no}) and all dependent semester courses, portfolios & gap records.`
    );

    this.notify();
    return true;
  }

  // --- CRUD: SEMESTERS ---
  public upsertSemester(data: Partial<AcademicSemester>): AcademicSemester {
    const studentIds = new Set(this.students.keys());
    const errors = validateSemester(data, studentIds);
    if (errors.length > 0) {
      throw new SchemaConstraintException('Constraint violation while validating semester', errors);
    }

    const isEdit = !!data.semester_id && this.semesters.has(data.semester_id);
    const semester_id = data.semester_id || `sem-${data.student_id}-${data.semester_number || Date.now()}`;

    const semester: AcademicSemester = {
      semester_id,
      student_id: data.student_id!,
      semester_number: data.semester_number || 1,
      academic_year: data.academic_year || '2023-2024',
      sgpa: data.sgpa || 0,
      cgpa: data.cgpa || 0,
      total_credits: data.total_credits || 0,
      earned_credits: data.earned_credits || 0,
      has_drop_year: !!data.has_drop_year,
      drop_reason: data.drop_reason,
    };

    this.semesters.set(semester_id, semester);
    this.recalculateStudentMetrics(semester.student_id);

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'SEMESTER',
      'LOCAL_DB',
      `${isEdit ? 'Updated' : 'Inserted'} Semester ${semester.semester_number} for student ${data.student_id}`
    );

    this.notify();
    return semester;
  }

  // --- CRUD: COURSES (THEORY & LAB) ---
  public upsertCourse(data: Partial<SemesterCourse>): SemesterCourse {
    const studentIds = new Set(this.students.keys());
    const semesterIds = new Set(this.semesters.keys());

    const errors = validateCourse(data, semesterIds, studentIds);
    if (errors.length > 0) {
      throw new SchemaConstraintException('Constraint violation while validating course', errors);
    }

    const internal = data.internal_marks ?? 0;
    const external = data.external_marks ?? 0;
    const total = internal + external;
    const { gradeLetter, gradePoint } = calculateGrade(total);

    const isEdit = !!data.course_id && this.courses.has(data.course_id);
    const course_id = data.course_id || 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const course: SemesterCourse = {
      course_id,
      semester_id: data.semester_id!,
      student_id: data.student_id!,
      course_code: (data.course_code || 'GEN101').toUpperCase().trim(),
      course_name: data.course_name || 'Subject',
      course_type: data.course_type || 'Theory',
      credits: data.credits || 3,
      internal_marks: internal,
      external_marks: external,
      total_marks: total,
      grade_letter: gradeLetter,
      grade_point: gradePoint,
      status: gradePoint >= 5 ? 'Passed' : 'Backlog',
    };

    this.courses.set(course_id, course);

    // Automatically recalculate semester SGPA and student CGPA
    this.recalculateSemesterMetrics(course.semester_id);

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'COURSE',
      'LOCAL_DB',
      `${isEdit ? 'Updated' : 'Added'} ${course.course_type} course ${course.course_code}: ${course.course_name} (Total: ${course.total_marks}/100, Grade: ${course.grade_letter})`
    );

    this.notify();
    return course;
  }

  public deleteCourse(courseId: string): boolean {
    const course = this.courses.get(courseId);
    if (!course) return false;

    const semesterId = course.semester_id;
    this.courses.delete(courseId);
    this.recalculateSemesterMetrics(semesterId);

    this.logAction(
      'DELETE',
      'COURSE',
      'LOCAL_DB',
      `Deleted ${course.course_type} course ${course.course_code} (${course.course_name})`
    );

    this.notify();
    return true;
  }

  // --- CRUD: SEMINARS ---
  public upsertSeminar(data: Partial<StudentSeminar>): StudentSeminar {
    const studentIds = new Set(this.students.keys());
    const errors = validateSeminar(data, studentIds);
    if (errors.length > 0) {
      throw new SchemaConstraintException('Constraint violation while validating seminar', errors);
    }

    const isEdit = !!data.seminar_id && this.seminars.has(data.seminar_id);
    const seminar_id = data.seminar_id || 'sem-rec-' + Date.now();

    const seminar: StudentSeminar = {
      seminar_id,
      student_id: data.student_id!,
      seminar_type: data.seminar_type || 'INTERNAL',
      title: data.title || 'Seminar Title',
      venue_or_organizer: data.venue_or_organizer || 'College Hall',
      date_conducted: data.date_conducted || new Date().toISOString().split('T')[0],
      role: data.role || 'Presenter',
      certificate_ref: data.certificate_ref,
      remarks: data.remarks,
    };

    this.seminars.set(seminar_id, seminar);

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'SEMINAR',
      'LOCAL_DB',
      `${isEdit ? 'Updated' : 'Recorded'} ${seminar.seminar_type} seminar: "${seminar.title}"`
    );

    this.notify();
    return seminar;
  }

  public deleteSeminar(seminarId: string): boolean {
    const sem = this.seminars.get(seminarId);
    if (!sem) return false;
    this.seminars.delete(seminarId);

    this.logAction('DELETE', 'SEMINAR', 'LOCAL_DB', `Deleted ${sem.seminar_type} seminar: "${sem.title}"`);
    this.notify();
    return true;
  }

  // --- CRUD: ACTIVITIES ---
  public upsertActivity(data: Partial<StudentActivity>): StudentActivity {
    const studentIds = new Set(this.students.keys());
    const errors = validateActivity(data, studentIds);
    if (errors.length > 0) {
      throw new SchemaConstraintException('Constraint violation while validating activity', errors);
    }

    const isEdit = !!data.activity_id && this.activities.has(data.activity_id);
    const activity_id = data.activity_id || 'act-' + Date.now();

    const activity: StudentActivity = {
      activity_id,
      student_id: data.student_id!,
      activity_class: data.activity_class || 'TECHNICAL_CO_CURRICULAR',
      category: data.category || 'Hackathon',
      event_name: data.event_name || 'Event',
      achievement_or_award: data.achievement_or_award || 'Participation',
      event_date: data.event_date || new Date().toISOString().split('T')[0],
      organizer: data.organizer || 'Organizer',
      impact_points: data.impact_points !== undefined ? data.impact_points : 100,
      certificate_ref: data.certificate_ref,
    };

    this.activities.set(activity_id, activity);

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'ACTIVITY',
      'LOCAL_DB',
      `${isEdit ? 'Updated' : 'Recorded'} ${activity.activity_class} event: "${activity.event_name}" (${activity.achievement_or_award})`
    );

    this.notify();
    return activity;
  }

  public deleteActivity(activityId: string): boolean {
    const act = this.activities.get(activityId);
    if (!act) return false;
    this.activities.delete(activityId);

    this.logAction('DELETE', 'ACTIVITY', 'LOCAL_DB', `Deleted activity: "${act.event_name}"`);
    this.notify();
    return true;
  }

  // --- CRUD: GAP RECORDS ---
  public upsertGap(data: Partial<AcademicGapRecord>): AcademicGapRecord {
    const isEdit = !!data.gap_id && this.gaps.has(data.gap_id);
    const gap_id = data.gap_id || 'gap-' + Date.now();

    const gap: AcademicGapRecord = {
      gap_id,
      student_id: data.student_id!,
      gap_type: data.gap_type || 'Mid-Course Drop Year',
      academic_year_affected: data.academic_year_affected || '2022-2023',
      duration_years: data.duration_years || 1,
      reason: data.reason || 'Academic Gap recorded',
      approved_by: data.approved_by || 'Dean of Academics',
      clearance_status: data.clearance_status || 'Approved',
    };

    this.gaps.set(gap_id, gap);

    // Sync status on student
    const student = this.students.get(gap.student_id);
    if (student) {
      student.status = 'Academic Gap / Drop';
    }

    this.logAction(
      isEdit ? 'UPDATE' : 'INSERT',
      'DATABASE',
      'LOCAL_DB',
      `Recorded ${gap.gap_type} (${gap.academic_year_affected}) for student ID: ${gap.student_id}`
    );

    this.notify();
    return gap;
  }

  public deleteGap(gapId: string): boolean {
    const gap = this.gaps.get(gapId);
    if (!gap) return false;
    this.gaps.delete(gapId);

    // Check if student still has gaps
    const remaining = this.getGaps(gap.student_id);
    const student = this.students.get(gap.student_id);
    if (student && remaining.length === 0) {
      student.status = 'Active';
    }

    this.logAction('DELETE', 'DATABASE', 'LOCAL_DB', `Deleted academic gap record for ${gap.academic_year_affected}`);
    this.notify();
    return true;
  }

  // --- RECALCULATIONS ---
  private recalculateSemesterMetrics(semesterId: string) {
    const sem = this.semesters.get(semesterId);
    if (!sem) return;

    const semesterCourses = this.getCourses(semesterId);
    const { sgpa, totalCredits, earnedCredits } = calculateSGPA(semesterCourses);

    sem.sgpa = sgpa;
    sem.total_credits = totalCredits;
    sem.earned_credits = earnedCredits;

    this.recalculateStudentMetrics(sem.student_id);
  }

  private recalculateStudentMetrics(studentId: string) {
    const studentSemesters = this.getSemesters(studentId);
    const cgpa = calculateCGPA(studentSemesters);

    for (const sem of studentSemesters) {
      sem.cgpa = cgpa;
    }
  }

  // --- SQL QUERY SIMULATOR FOR EVALUATORS ---
  public executeSql(sql: string): { columns: string[]; rows: any[]; error?: string; rowCount: number } {
    try {
      const trimmed = sql.trim().replace(/;$/, '');
      const match = trimmed.match(/^SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?$/i);

      if (!match) {
        return {
          columns: ['ERROR'],
          rows: [{ ERROR: 'Only SELECT queries are supported in simulator. (Syntax: SELECT ... FROM ... WHERE ...)' }],
          rowCount: 0,
          error: 'Unsupported SQL statement. Use SELECT queries.'
        };
      }

      const [, rawCols, tableName, rawWhere] = match;
      let dataset: any[] = [];

      switch (tableName.toLowerCase()) {
        case 'students':
          dataset = this.getStudents();
          break;
        case 'academic_semesters':
        case 'semesters':
          dataset = this.getAllSemesters();
          break;
        case 'semester_courses':
        case 'courses':
          dataset = this.getAllCourses();
          break;
        case 'student_seminars':
        case 'seminars':
          dataset = this.getSeminars();
          break;
        case 'student_activities':
        case 'activities':
          dataset = this.getActivities();
          break;
        case 'academic_gap_records':
        case 'gaps':
          dataset = this.getGaps();
          break;
        default:
          return {
            columns: ['ERROR'],
            rows: [{ ERROR: `Table '${tableName}' not found in relational schema.` }],
            rowCount: 0,
            error: `Table '${tableName}' not found.`
          };
      }

      // Simple WHERE filter parser: col = 'value' OR col >= num
      if (rawWhere) {
        const condMatch = rawWhere.match(/(\w+)\s*(=|!=|>|<|>=|<=|LIKE)\s*(.*)/i);
        if (condMatch) {
          const [, col, op, valRaw] = condMatch;
          const cleanVal = valRaw.trim().replace(/^['"]|['"]$/g, '');

          dataset = dataset.filter((row) => {
            const rowVal = row[col];
            if (rowVal === undefined) return false;

            if (op === '=') return String(rowVal).toLowerCase() === cleanVal.toLowerCase();
            if (op === '!=') return String(rowVal).toLowerCase() !== cleanVal.toLowerCase();
            if (op === '>') return Number(rowVal) > Number(cleanVal);
            if (op === '>=') return Number(rowVal) >= Number(cleanVal);
            if (op === '<') return Number(rowVal) < Number(cleanVal);
            if (op === '<=') return Number(rowVal) <= Number(cleanVal);
            if (op.toUpperCase() === 'LIKE') {
              const regexStr = cleanVal.replace(/%/g, '.*');
              return new RegExp(regexStr, 'i').test(String(rowVal));
            }
            return true;
          });
        }
      }

      if (dataset.length === 0) {
        return { columns: ['Result'], rows: [{ Result: '0 rows returned' }], rowCount: 0 };
      }

      let columns: string[] = [];
      if (rawCols.trim() === '*') {
        columns = Object.keys(dataset[0]);
      } else {
        columns = rawCols.split(',').map((c) => c.trim());
      }

      const rows = dataset.map((item) => {
        const rowObj: any = {};
        columns.forEach((col) => {
          rowObj[col] = item[col] !== undefined ? item[col] : null;
        });
        return rowObj;
      });

      return { columns, rows, rowCount: rows.length };
    } catch (err: any) {
      return {
        columns: ['ERROR'],
        rows: [{ ERROR: err.message || 'SQL execution failed' }],
        rowCount: 0,
        error: err.message
      };
    }
  }
}

export const db = new RelationalDatabase();
