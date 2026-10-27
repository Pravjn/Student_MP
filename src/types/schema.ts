/**
 * 3NF Relational Database Schema Types for ScholarPulse
 * DBMS Mini-Project: Student Academic & Portfolio Progression System
 */

export interface Student {
  student_id: string; // Primary Key
  roll_no: string; // Unique, e.g. "2021CSE042"
  full_name: string; // NOT NULL
  email: string; // Unique NOT NULL
  phone: string;
  department: string; // e.g. "Computer Science & Engineering"
  batch_year: number; // e.g. 2021
  current_semester: number; // CHECK BETWEEN 1 AND 8
  status: 'Active' | 'Graduated' | 'Academic Gap / Drop';
  
  // Secondary (10th) Academic Record
  secondary_board: string; // e.g. "CBSE", "ICSE", "State Board"
  secondary_percentage: number; // CHECK BETWEEN 0 AND 100
  secondary_passing_year: number;
  
  // Higher Secondary (12th) Academic Record
  higher_sec_board: string; // e.g. "CBSE", "ISC", "State Board"
  higher_sec_percentage: number; // CHECK BETWEEN 0 AND 100
  higher_sec_stream: string; // e.g. "Science (PCM)", "Science (PCMB)"
  higher_sec_passing_year: number;
  
  created_at: string;
  updated_at: string;
}

export interface AcademicSemester {
  semester_id: string; // Primary Key
  student_id: string; // Foreign Key -> Student.student_id ON DELETE CASCADE
  semester_number: number; // CHECK BETWEEN 1 AND 8
  academic_year: string; // e.g. "2021-2022"
  sgpa: number; // CHECK BETWEEN 0 AND 10
  cgpa: number; // CHECK BETWEEN 0 AND 10
  total_credits: number; // CHECK > 0
  earned_credits: number; // CHECK >= 0
  has_drop_year: boolean; // Gap / Drop indicator flag
  drop_reason?: string; // Reason if dropped (e.g., Medical, Competitive Exam prep)
}

export type CourseType = 'Theory' | 'Lab' | 'Project' | 'Seminar';
export type GradeLetter = 'O' | 'E' | 'A' | 'B' | 'C' | 'D' | 'F';
export type CourseStatus = 'Passed' | 'Backlog' | 'In Progress';

export interface SemesterCourse {
  course_id: string; // Primary Key
  semester_id: string; // Foreign Key -> AcademicSemester.semester_id ON DELETE CASCADE
  student_id: string; // Foreign Key -> Student.student_id ON DELETE CASCADE
  course_code: string; // e.g. "CS501", "CS591"
  course_name: string; // e.g. "Database Management Systems", "DBMS Laboratory"
  course_type: CourseType; // Theory vs Lab
  credits: number; // CHECK > 0 AND <= 10
  internal_marks: number; // CHECK BETWEEN 0 AND 40
  external_marks: number; // CHECK BETWEEN 0 AND 60
  total_marks: number; // CHECK BETWEEN 0 AND 100
  grade_letter: GradeLetter; // O, E, A, B, C, D, F
  grade_point: number; // CHECK BETWEEN 0 AND 10
  status: CourseStatus; // Passed / Backlog / In Progress
}

export type SeminarType = 'INTERNAL' | 'EXTERNAL';
export type SeminarRole = 'Presenter' | 'Attendee' | 'Keynote Student Speaker';

export interface StudentSeminar {
  seminar_id: string; // Primary Key
  student_id: string; // Foreign Key -> Student.student_id ON DELETE CASCADE
  seminar_type: SeminarType; // INTERNAL vs EXTERNAL
  title: string;
  venue_or_organizer: string;
  date_conducted: string;
  role: SeminarRole;
  certificate_ref?: string;
  remarks?: string;
}

export type ActivityClass = 'TECHNICAL_CO_CURRICULAR' | 'EXTRA_CURRICULAR';
export type ActivityCategory = 
  | 'Hackathon'
  | 'Coding Competition'
  | 'Paper Presentation'
  | 'Technical Workshop'
  | 'Sports & Athletics'
  | 'Cultural & Arts'
  | 'NSS & Social Outreach';

export type AwardLevel = '1st Place' | 'Runner Up' | 'Consolation' | 'Participation' | 'Lead Organizer';

export interface StudentActivity {
  activity_id: string; // Primary Key
  student_id: string; // Foreign Key -> Student.student_id ON DELETE CASCADE
  activity_class: ActivityClass; // Technical / Co-curricular vs Extra-curricular
  category: ActivityCategory;
  event_name: string;
  achievement_or_award: AwardLevel;
  event_date: string;
  organizer: string;
  impact_points: number; // CHECK >= 0
  certificate_ref?: string;
}

export interface AcademicGapRecord {
  gap_id: string; // Primary Key
  student_id: string; // Foreign Key -> Student.student_id ON DELETE CASCADE
  gap_type: 'Pre-College Gap' | 'Mid-Course Drop Year' | 'Medical Leave' | 'Semester Repeat';
  academic_year_affected: string; // e.g. "2022-2023"
  duration_years: number; // CHECK > 0
  reason: string;
  approved_by: string;
  clearance_status: 'Approved' | 'Under Review' | 'Cleared';
}

export interface SyncLogEntry {
  log_id: string;
  timestamp: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'FULL_SYNC' | 'SPREADSHEET_EXPORT' | 'SPREADSHEET_IMPORT';
  entity: 'STUDENT' | 'SEMESTER' | 'COURSE' | 'SEMINAR' | 'ACTIVITY' | 'DATABASE';
  target: 'GOOGLE_SHEETS' | 'EXCEL_FILE' | 'LOCAL_DB';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  details: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  webAppUrl: string | null; // Google Apps Script Web App Deployment URL
  connectionMode: 'APPS_SCRIPT' | 'OAUTH' | 'DIRECT_URL';
  title: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

