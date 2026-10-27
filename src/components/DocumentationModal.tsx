import React, { useState } from 'react';
import { X, BookOpen, Terminal, CheckCircle2, ShieldCheck, Database, Copy, Check } from 'lucide-react';
import { db } from '../db/relationalStore';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'schema' | 'ddl' | 'constraints' | 'sql_console'>('guide');
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM students;");
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[]; error?: string; rowCount: number } | null>(null);
  const [copiedDdl, setCopiedDdl] = useState(false);

  if (!isOpen) return null;

  const handleRunSql = () => {
    const result = db.executeSql(sqlQuery);
    setSqlResult(result);
  };

  const ddlScript = `-- ====================================================================
-- ScholarPulse DBMS Mini-Project: 3NF Relational Database DDL Schema
-- Compatible with PostgreSQL 14+, MySQL 8.0+, SQLite 3
-- Enforces: 3NF Normalization, FOREIGN KEY ON DELETE CASCADE, CHECK Constraints
-- ====================================================================

-- 1. Students Table (3NF Profile: Eliminates duplicate profile strings)
CREATE TABLE students (
    student_id VARCHAR(64) PRIMARY KEY,
    roll_no VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    phone VARCHAR(32),
    department VARCHAR(64) NOT NULL,
    batch_year INTEGER NOT NULL CHECK (batch_year >= 2000),
    current_semester INTEGER NOT NULL CHECK (current_semester BETWEEN 1 AND 8),
    status VARCHAR(32) NOT NULL DEFAULT 'Active' 
        CHECK (status IN ('Active', 'Graduated', 'Academic Gap / Drop')),
    
    -- Secondary (10th) Academic Metrics
    secondary_board VARCHAR(64) NOT NULL,
    secondary_percentage NUMERIC(5,2) NOT NULL 
        CHECK (secondary_percentage BETWEEN 0 AND 100),
    secondary_passing_year INTEGER NOT NULL,
    
    -- Higher Secondary (12th) Academic Metrics
    higher_sec_board VARCHAR(64) NOT NULL,
    higher_sec_percentage NUMERIC(5,2) NOT NULL 
        CHECK (higher_sec_percentage BETWEEN 0 AND 100),
    higher_sec_stream VARCHAR(64) NOT NULL,
    higher_sec_passing_year INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Semesters Progression Table
CREATE TABLE academic_semesters (
    semester_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    academic_year VARCHAR(32) NOT NULL, -- e.g. '2021-2022'
    sgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (sgpa BETWEEN 0 AND 10),
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cgpa BETWEEN 0 AND 10),
    total_credits INTEGER NOT NULL DEFAULT 0 CHECK (total_credits >= 0),
    earned_credits INTEGER NOT NULL DEFAULT 0 CHECK (earned_credits >= 0),
    has_drop_year BOOLEAN NOT NULL DEFAULT FALSE,
    drop_reason TEXT,
    
    -- Enforce Foreign Key with Cascading Deletions
    CONSTRAINT fk_semesters_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT uq_student_semester UNIQUE (student_id, semester_number)
);

-- 3. Semester Courses & Laboratory Practicals Table
CREATE TABLE semester_courses (
    course_id VARCHAR(64) PRIMARY KEY,
    semester_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    course_code VARCHAR(32) NOT NULL,
    course_name VARCHAR(128) NOT NULL,
    course_type VARCHAR(16) NOT NULL 
        CHECK (course_type IN ('Theory', 'Lab', 'Project', 'Seminar')),
    credits INTEGER NOT NULL CHECK (credits > 0 AND credits <= 10),
    internal_marks NUMERIC(5,2) NOT NULL CHECK (internal_marks BETWEEN 0 AND 40),
    external_marks NUMERIC(5,2) NOT NULL CHECK (external_marks BETWEEN 0 AND 60),
    total_marks NUMERIC(5,2) NOT NULL CHECK (total_marks BETWEEN 0 AND 100),
    grade_letter CHAR(2) NOT NULL CHECK (grade_letter IN ('O', 'E', 'A', 'B', 'C', 'D', 'F')),
    grade_point NUMERIC(3,1) NOT NULL CHECK (grade_point BETWEEN 0 AND 10),
    status VARCHAR(16) NOT NULL CHECK (status IN ('Passed', 'Backlog', 'In Progress')),
    
    CONSTRAINT fk_courses_semester FOREIGN KEY (semester_id)
        REFERENCES academic_semesters(semester_id) ON DELETE CASCADE,
    CONSTRAINT fk_courses_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

-- 4. Segregated Portfolio: Student Seminars Table
CREATE TABLE student_seminars (
    seminar_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    seminar_type VARCHAR(16) NOT NULL CHECK (seminar_type IN ('INTERNAL', 'EXTERNAL')),
    title VARCHAR(256) NOT NULL,
    venue_or_organizer VARCHAR(128) NOT NULL,
    date_conducted DATE NOT NULL,
    role VARCHAR(64) NOT NULL CHECK (role IN ('Presenter', 'Attendee', 'Keynote Student Speaker')),
    certificate_ref VARCHAR(128),
    remarks TEXT,
    
    CONSTRAINT fk_seminars_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

-- 5. Segregated Portfolio: Student Activities Table
CREATE TABLE student_activities (
    activity_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    activity_class VARCHAR(32) NOT NULL 
        CHECK (activity_class IN ('TECHNICAL_CO_CURRICULAR', 'EXTRA_CURRICULAR')),
    category VARCHAR(64) NOT NULL,
    event_name VARCHAR(256) NOT NULL,
    achievement_or_award VARCHAR(64) NOT NULL,
    event_date DATE NOT NULL,
    organizer VARCHAR(128) NOT NULL,
    impact_points INTEGER NOT NULL DEFAULT 0 CHECK (impact_points >= 0),
    certificate_ref VARCHAR(128),
    
    CONSTRAINT fk_activities_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

-- 6. Academic Gap & Drop Year Tracking Table
CREATE TABLE academic_gap_records (
    gap_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    gap_type VARCHAR(64) NOT NULL,
    academic_year_affected VARCHAR(32) NOT NULL,
    duration_years NUMERIC(3,1) NOT NULL CHECK (duration_years > 0),
    reason TEXT NOT NULL,
    approved_by VARCHAR(128) NOT NULL,
    clearance_status VARCHAR(32) NOT NULL DEFAULT 'Approved',
    
    CONSTRAINT fk_gaps_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

-- Indexes for High Performance Queries
CREATE INDEX idx_students_roll ON students(roll_no);
CREATE INDEX idx_courses_semester ON semester_courses(semester_id);
CREATE INDEX idx_courses_student ON semester_courses(student_id);
CREATE INDEX idx_seminars_type ON student_seminars(seminar_type);
CREATE INDEX idx_activities_class ON student_activities(activity_class);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ddlScript);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="doc-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                DBMS Mini-Project Technical Report & Deliverables
              </h2>
              <p className="text-xs text-slate-500">
                Operational Guide, 3NF Relational Normalization, Schema Constraints & SQL DDL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Operational Guide
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. 3NF Schema & ER Analysis
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'constraints'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Constraints & Violations
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ddl'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            4. SQL DDL Script
          </button>
          <button
            onClick={() => setActiveTab('sql_console')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql_console'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            5. SQL Query Simulator
          </button>
        </div>

        {/* Content Pane */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: OPERATIONAL GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                  ScholarPulse Operational Guide
                </h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  This system tracks student academic progression (Secondary, Higher Secondary, Semester theory & lab marks, Drop/gap years) and segregated portfolios (Seminars & Activities), synchronizing continuously with Google Spreadsheets and Excel workbooks.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Managing Student Records & Progression
                  </h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400 pl-7">
                    Select any student from the top card carousel to inspect their entire profile, SGPA/CGPA progression curve, theory & lab marks breakdown, and portfolios. Click <strong>"New Student"</strong> to register a new student with Secondary (10th) and Higher Secondary (12th) metrics.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Recording Subject Marks & Automatic SGPA/CGPA Calculation
                  </h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400 pl-7">
                    Click <strong>"Add Theory Subject"</strong> or <strong>"Add Lab Practical"</strong> in the Semester Academic Records tab. Enter internal assessment (max 40) and external end-semester exam marks (max 60). The system automatically evaluates the total (max 100), maps it to a standard letter grade ('O', 'E', 'A', 'B', 'C', 'D', 'F') and grade point, and immediately recalculates the credit-weighted SGPA and student CGPA!
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Tracking Academic Drop / Gap Years
                  </h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400 pl-7">
                    Click <strong>"Manage Gap Years"</strong> or switch to the <em>Gap Years</em> subtab under Portfolios to record official academic drops (e.g. medical leave, competitive exam prep, semester repeat). The dynamic progression graph immediately plots an amber dashed visual marker, highlighted background column, and warning badge indicating the drop year.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">4</span>
                    Google Sheets & Excel (.xlsx) Synchronisation
                  </h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400 pl-7">
                    Click <strong>"Sign in to Sync Sheets"</strong> in the header to authenticate with Google Drive/Sheets. Once authenticated, click <strong>"Sync Sheets"</strong>: the system creates or updates a multi-tab Google Spreadsheet directly in your Google Drive with live shareable links. Furthermore, you can download a full multi-sheet Excel (.xlsx) file at any time via the Excel menu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA & NORMALIZATION */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Relational Decomposition & Normal Forms (1NF &rarr; 2NF &rarr; 3NF)
                </h3>
                <p className="mt-1 text-slate-500">
                  Proof of strict Third Normal Form (3NF) adherence across all application entities:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">First Normal Form (1NF)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Every column contains purely atomic values. Repeating groups (such as arrays of subjects, marks, or multiple seminars) are removed from the student profile and segregated into dedicated child tables with primary keys.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Second Normal Form (2NF)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    All non-key attributes are fully functionally dependent on the entire primary key. In `semester_courses`, course attributes depend entirely on `course_id`, eliminating partial key dependencies.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Third Normal Form (3NF)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Eliminates transitive dependencies (X &rarr; Y &rarr; Z). Portfolio categories and seminar classifications are normalized, preventing repeated string duplication and data anomalies during updates.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                <div className="text-indigo-400 font-bold mb-1">// Entity Relationship Hierarchy</div>
                <div>students (student_id [PK], roll_no [UQ], full_name, email [UQ], secondary_pct, higher_sec_pct)</div>
                <div className="pl-4">├── 1:N ──&gt; academic_semesters (semester_id [PK], student_id [FK ON DELETE CASCADE], sgpa, cgpa)</div>
                <div className="pl-8">└── 1:N ──&gt; semester_courses (course_id [PK], semester_id [FK CASCADE], student_id [FK CASCADE], marks, grade)</div>
                <div className="pl-4">├── 1:N ──&gt; student_seminars (seminar_id [PK], student_id [FK CASCADE], seminar_type, title, role)</div>
                <div className="pl-4">├── 1:N ──&gt; student_activities (activity_id [PK], student_id [FK CASCADE], activity_class, award, points)</div>
                <div className="pl-4">└── 1:N ──&gt; academic_gap_records (gap_id [PK], student_id [FK CASCADE], gap_type, academic_year_affected)</div>
              </div>
            </div>
          )}

          {/* TAB 3: CONSTRAINTS & VIOLATION HANDLING */}
          {activeTab === 'constraints' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Enforced Relational Constraints & Exception Handling
                </h3>
                <p className="mt-1 text-slate-500">
                  All modifications pass through the validation engine. When a violation is attempted, the database aborts transaction and surfaces explanatory feedback:
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Constraint Type</th>
                      <th className="p-2.5">Target Field / Rule</th>
                      <th className="p-2.5">SQL Syntax</th>
                      <th className="p-2.5">Violation Handling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">FOREIGN KEY</td>
                      <td className="p-2.5 font-sans">Student &rarr; Semesters &rarr; Courses</td>
                      <td className="p-2.5 text-slate-500">ON DELETE CASCADE</td>
                      <td className="p-2.5 font-sans">Automatic cascading purge of dependent child marks and portfolio items.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">CHECK Range</td>
                      <td className="p-2.5 font-sans">Internal Marks</td>
                      <td className="p-2.5 text-slate-500">CHECK (internal_marks BETWEEN 0 AND 40)</td>
                      <td className="p-2.5 font-sans">Values &lt; 0 or &gt; 40 rejected with form error.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">CHECK Range</td>
                      <td className="p-2.5 font-sans">External Semester Exam</td>
                      <td className="p-2.5 text-slate-500">CHECK (external_marks BETWEEN 0 AND 60)</td>
                      <td className="p-2.5 font-sans">Values &gt; 60 rejected with form error.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">CHECK Range</td>
                      <td className="p-2.5 font-sans">SGPA & CGPA</td>
                      <td className="p-2.5 text-slate-500">CHECK (sgpa BETWEEN 0 AND 10)</td>
                      <td className="p-2.5 font-sans">Formula calculates credit-weighted average clamped to 0.00-10.00.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">UNIQUE</td>
                      <td className="p-2.5 font-sans">Roll Number & Email</td>
                      <td className="p-2.5 text-slate-500">UNIQUE NOT NULL</td>
                      <td className="p-2.5 font-sans">Duplicate enrollment prevented; triggers `UNIQUE_VIOLATION`.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-600">CHECK Set</td>
                      <td className="p-2.5 font-sans">Seminar Type</td>
                      <td className="p-2.5 text-slate-500">CHECK (seminar_type IN ('INTERNAL', 'EXTERNAL'))</td>
                      <td className="p-2.5 font-sans">Enforces segregated portfolio categorization.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SQL DDL SCRIPT */}
          {activeTab === 'ddl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Complete PostgreSQL / MySQL 3NF DDL Script
                  </h3>
                  <p className="text-xs text-slate-500">
                    Production SQL schema with tables, constraints, indexes, and cascading foreign keys.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDdl ? 'Copied DDL!' : 'Copy SQL'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {ddlScript}
              </pre>
            </div>
          )}

          {/* TAB 5: SQL QUERY SIMULATOR */}
          {activeTab === 'sql_console' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Interactive SQL Query Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute live SELECT queries against the normalized database tables (`students`, `semester_courses`, `student_seminars`, `student_activities`, `academic_gap_records`).
                </p>
              </div>

              {/* Sample Quick Query Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Quick Queries:</span>
                <button
                  onClick={() => setSqlQuery("SELECT roll_no, full_name, department, current_semester FROM students;")}
                  className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-mono"
                >
                  List Students
                </button>
                <button
                  onClick={() => setSqlQuery("SELECT course_code, course_name, credits, total_marks, grade_letter FROM semester_courses WHERE course_type = 'Lab';")}
                  className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-mono"
                >
                  Filter Lab Courses
                </button>
                <button
                  onClick={() => setSqlQuery("SELECT title, venue_or_organizer, role FROM student_seminars WHERE seminar_type = 'EXTERNAL';")}
                  className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-mono"
                >
                  External Seminars
                </button>
                <button
                  onClick={() => setSqlQuery("SELECT event_name, category, achievement_or_award, impact_points FROM student_activities WHERE impact_points >= 300;")}
                  className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-mono"
                >
                  High Impact Activities
                </button>
              </div>

              {/* Query Input */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleRunSql}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Execute SQL Query
                </button>
              </div>

              {/* Results Table */}
              {sqlResult && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500 font-mono">
                    <span>Status: {sqlResult.error ? 'ERROR' : 'SUCCESS'}</span>
                    <span>Rows: {sqlResult.rowCount}</span>
                  </div>

                  {sqlResult.error ? (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs">
                      {sqlResult.error}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950">
                      <table className="w-full text-left font-mono text-xs text-slate-300">
                        <thead className="bg-slate-900 text-indigo-400 border-b border-slate-800">
                          <tr>
                            {sqlResult.columns.map((col) => (
                              <th key={col} className="p-2.5">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {sqlResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              {sqlResult.columns.map((col) => (
                                <td key={col} className="p-2.5 truncate max-w-xs">
                                  {row[col] !== null ? String(row[col]) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
