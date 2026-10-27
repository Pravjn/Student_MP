import React, { useState, useEffect } from 'react';
import { db } from './db/relationalStore';
import {
  Student,
  AcademicSemester,
  SemesterCourse,
  StudentSeminar,
  StudentActivity,
  AcademicGapRecord
} from './types/schema';
import { initAuth } from './services/firebaseAuth';
import { User } from 'firebase/auth';

import { Header } from './components/Header';
import { StudentSelector } from './components/StudentSelector';
import { StudentProfileBanner } from './components/StudentProfileBanner';
import { AnalyticsOverview } from './components/AnalyticsOverview';
import { AcademicMilestoneTimeline } from './components/AcademicMilestoneTimeline';
import { PerformanceComparisonChart } from './components/PerformanceComparisonChart';
import { PortfolioDistributionVisual } from './components/PortfolioDistributionVisual';
import { SyncPipelineDiagram } from './components/SyncPipelineDiagram';
import { SemesterGradesView } from './components/SemesterGradesView';
import { PortfoliosView } from './components/PortfoliosView';

import { StudentModal } from './components/StudentModal';
import { CourseModal } from './components/CourseModal';
import { SeminarModal } from './components/SeminarModal';
import { ActivityModal } from './components/ActivityModal';
import { GapModal } from './components/GapModal';
import { DocumentationModal } from './components/DocumentationModal';
import { SyncManagerModal } from './components/SyncManagerModal';
import { ConnectSheetModal } from './components/ConnectSheetModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database State
  const [students, setStudents] = useState<Student[]>(() => db.getStudents());
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    const list = db.getStudents();
    return list.length > 0 ? list[0].student_id : null;
  });
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);

  // Modals State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SemesterCourse | null>(null);
  const [courseModalSemId, setCourseModalSemId] = useState<string>('');
  const [courseModalDefaultType, setCourseModalDefaultType] = useState<'Theory' | 'Lab'>('Theory');

  const [isSeminarModalOpen, setIsSeminarModalOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<StudentSeminar | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<StudentActivity | null>(null);

  const [isGapModalOpen, setIsGapModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isConnectSheetOpen, setIsConnectSheetOpen] = useState(false);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Subscribe to relational database changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setStudents(db.getStudents());
    });
    return unsubscribe;
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsub = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsub();
  }, []);

  // Filter students by search query
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.roll_no.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // Active student and related entities
  const activeStudent = students.find((s) => s.student_id === selectedStudentId) || students[0] || null;
  const activeSemesters = activeStudent ? db.getSemesters(activeStudent.student_id) : [];
  const activeCourses = activeStudent ? db.getAllCourses().filter((c) => c.student_id === activeStudent.student_id) : [];
  const activeSeminars = activeStudent ? db.getSeminars(activeStudent.student_id) : [];
  const activeActivities = activeStudent ? db.getActivities(activeStudent.student_id) : [];
  const activeGaps = activeStudent ? db.getGaps(activeStudent.student_id) : [];

  // Update default active semester if selection changes
  useEffect(() => {
    if (activeSemesters.length > 0 && (!activeSemesterId || !activeSemesters.some((s) => s.semester_id === activeSemesterId))) {
      setActiveSemesterId(activeSemesters[0].semester_id);
    }
  }, [selectedStudentId, activeSemesters.length]);

  // --- Handlers: Student ---
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = () => {
    if (!activeStudent) return;
    setEditingStudent(activeStudent);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (data: Partial<Student>) => {
    const saved = db.upsertStudent(data);
    setSelectedStudentId(saved.student_id);
    setIsStudentModalOpen(false);
  };

  const handleRequestDeleteStudent = () => {
    if (!activeStudent) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Student: ${activeStudent.full_name}`,
      message: `Are you sure you want to delete ${activeStudent.full_name} (${activeStudent.roll_no})? This will CASCADE DELETE all related academic semesters, theory and lab marks, seminars, activities, and gap records from the database.`,
      onConfirm: () => {
        db.deleteStudent(activeStudent.student_id);
        const remaining = db.getStudents();
        setSelectedStudentId(remaining.length > 0 ? remaining[0].student_id : null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Handlers: Course / Lab Marks ---
  const handleOpenAddCourse = (semesterId: string, defaultType: 'Theory' | 'Lab' = 'Theory') => {
    setCourseModalSemId(semesterId);
    setCourseModalDefaultType(defaultType);
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: SemesterCourse) => {
    setCourseModalSemId(course.semester_id);
    setCourseModalDefaultType(course.course_type === 'Lab' ? 'Lab' : 'Theory');
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (data: Partial<SemesterCourse>) => {
    db.upsertCourse(data);
    setIsCourseModalOpen(false);
  };

  const handleRequestDeleteCourse = (course: SemesterCourse) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Course: ${course.course_code}`,
      message: `Are you sure you want to delete ${course.course_code} (${course.course_name})? This will immediately recalculate the semester SGPA and student CGPA.`,
      onConfirm: () => {
        db.deleteCourse(course.course_id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Handlers: Seminar ---
  const handleOpenAddSeminar = () => {
    setEditingSeminar(null);
    setIsSeminarModalOpen(true);
  };

  const handleOpenEditSeminar = (sem: StudentSeminar) => {
    setEditingSeminar(sem);
    setIsSeminarModalOpen(true);
  };

  const handleSaveSeminar = (data: Partial<StudentSeminar>) => {
    db.upsertSeminar(data);
    setIsSeminarModalOpen(false);
  };

  const handleRequestDeleteSeminar = (sem: StudentSeminar) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Seminar: ${sem.title}`,
      message: `Are you sure you want to delete this ${sem.seminar_type} seminar entry?`,
      onConfirm: () => {
        db.deleteSeminar(sem.seminar_id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Handlers: Activity ---
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: StudentActivity) => {
    setEditingActivity(act);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (data: Partial<StudentActivity>) => {
    db.upsertActivity(data);
    setIsActivityModalOpen(false);
  };

  const handleRequestDeleteActivity = (act: StudentActivity) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Activity: ${act.event_name}`,
      message: `Are you sure you want to remove ${act.event_name} (${act.achievement_or_award}) from this student's portfolio?`,
      onConfirm: () => {
        db.deleteActivity(act.activity_id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Handlers: Gap Record ---
  const handleOpenAddGap = () => {
    setIsGapModalOpen(true);
  };

  const handleSaveGap = (data: Partial<AcademicGapRecord>) => {
    db.upsertGap(data);
    setIsGapModalOpen(false);
  };

  const handleRequestDeleteGap = (gap: AcademicGapRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Academic Gap Record`,
      message: `Delete recorded gap year for ${gap.academic_year_affected} (${gap.gap_type})?`,
      onConfirm: () => {
        db.deleteGap(gap.gap_id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header with Search, Google Sheets Auth & Actions */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onAuthSuccess={(user) => setCurrentUser(user)}
        onAuthLogout={() => setCurrentUser(null)}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onOpenSyncManager={() => setIsSyncModalOpen(true)}
        onOpenConnectSheet={() => setIsConnectSheetOpen(true)}
        onOpenAddStudent={handleOpenAddStudent}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Student Selector Carousel */}
        <StudentSelector
          students={filteredStudents}
          selectedStudentId={selectedStudentId}
          onSelectStudent={(id) => setSelectedStudentId(id)}
          onAddStudent={handleOpenAddStudent}
        />

        {activeStudent ? (
          <>
            {/* Student Profile Banner: 10th & 12th Records, Gap Year Alert */}
            <StudentProfileBanner
              student={activeStudent}
              gaps={activeGaps}
              onEditStudent={handleOpenEditStudent}
              onDeleteStudent={handleRequestDeleteStudent}
              onOpenGapModal={handleOpenAddGap}
            />

            {/* Analytics Overview: KPI Cards & Dynamic SGPA/CGPA Progression Curve with Drop Year Marker */}
            <AnalyticsOverview
              semesters={activeSemesters}
              courses={activeCourses}
              seminars={activeSeminars}
              activities={activeActivities}
              gaps={activeGaps}
            />

            {/* Visual 1: Academic Milestones & Gap Year Timeline */}
            <AcademicMilestoneTimeline
              student={activeStudent}
              semesters={activeSemesters}
              gaps={activeGaps}
            />

            {/* Visual 2: Theory Exams vs Laboratory Practicals Comparison */}
            <PerformanceComparisonChart
              semesters={activeSemesters}
              courses={activeCourses}
            />

            {/* Visual 3: Segregated Portfolio Distribution & Impact Score */}
            <PortfolioDistributionVisual
              seminars={activeSeminars}
              activities={activeActivities}
            />

            {/* Visual 4: Live Spreadsheet & Database Synchronization Pipeline */}
            <SyncPipelineDiagram
              currentUser={currentUser}
              onOpenSyncManager={() => setIsSyncModalOpen(true)}
            />

            {/* Semester Academic Records: Theory Subjects & Lab Practicals with Live SGPA Recalculation */}
            <SemesterGradesView
              semesters={activeSemesters}
              activeSemesterId={activeSemesterId}
              onSelectSemester={(semId) => setActiveSemesterId(semId)}
              onOpenAddCourse={(semId, type) => handleOpenAddCourse(semId, type)}
              onOpenEditCourse={handleOpenEditCourse}
              onRequestDeleteCourse={handleRequestDeleteCourse}
            />

            {/* Segregated Portfolios: Seminars (Internal vs External), Activities (Co-curricular vs Extracurricular), Gap Years */}
            <PortfoliosView
              studentId={activeStudent.student_id}
              seminars={activeSeminars}
              activities={activeActivities}
              gaps={activeGaps}
              onOpenAddSeminar={handleOpenAddSeminar}
              onOpenEditSeminar={handleOpenEditSeminar}
              onRequestDeleteSeminar={handleRequestDeleteSeminar}
              onOpenAddActivity={handleOpenAddActivity}
              onOpenEditActivity={handleOpenEditActivity}
              onRequestDeleteActivity={handleRequestDeleteActivity}
              onOpenAddGap={handleOpenAddGap}
              onRequestDeleteGap={handleRequestDeleteGap}
            />
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Student Selected</h2>
            <p className="text-xs text-slate-500 mt-1">Please select or register a student above to inspect progression.</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>ScholarPulse DBMS Mini-Project</strong> • 3NF Normalized Relational Architecture
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsDocsModalOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Schema Report & SQL DDL
            </button>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Spreadsheet Sync Status
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <StudentModal
        isOpen={isStudentModalOpen}
        student={editingStudent}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        semesterId={courseModalSemId}
        studentId={activeStudent ? activeStudent.student_id : ''}
        defaultType={courseModalDefaultType}
        course={editingCourse}
        onClose={() => setIsCourseModalOpen(false)}
        onSave={handleSaveCourse}
      />

      <SeminarModal
        isOpen={isSeminarModalOpen}
        studentId={activeStudent ? activeStudent.student_id : ''}
        seminar={editingSeminar}
        onClose={() => setIsSeminarModalOpen(false)}
        onSave={handleSaveSeminar}
      />

      <ActivityModal
        isOpen={isActivityModalOpen}
        studentId={activeStudent ? activeStudent.student_id : ''}
        activity={editingActivity}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
      />

      <GapModal
        isOpen={isGapModalOpen}
        studentId={activeStudent ? activeStudent.student_id : ''}
        onClose={() => setIsGapModalOpen(false)}
        onSave={handleSaveGap}
      />

      <DocumentationModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />

      <SyncManagerModal
        isOpen={isSyncModalOpen}
        currentUser={currentUser}
        onClose={() => setIsSyncModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
        onOpenConnectSheet={() => setIsConnectSheetOpen(true)}
      />

      <ConnectSheetModal
        isOpen={isConnectSheetOpen}
        onClose={() => setIsConnectSheetOpen(false)}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
