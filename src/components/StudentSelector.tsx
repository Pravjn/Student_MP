import React, { useState, useMemo } from 'react';
import { Student } from '../types/schema';
import { db } from '../db/relationalStore';
import {
  AlertTriangle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus,
  RefreshCw,
  Mail
} from 'lucide-react';

interface StudentSelectorProps {
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: () => void;
}

const ITEMS_PER_PAGE = 8;

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onAddStudent,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Departments list for filter
  const departments = useMemo(() => {
    const depts = Array.from(new Set(students.map((s) => s.department)));
    return ['ALL', ...depts];
  }, [students]);

  // Filter students
  const filteredList = useMemo(() => {
    return students.filter((s) => {
      const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'GAP' && (s.status === 'Academic Gap / Drop' || db.getGaps(s.student_id).length > 0)) ||
        (selectedStatus === 'ACTIVE' && s.status === 'Active') ||
        (selectedStatus === 'GRAD' && s.status === 'Graduated');
      return matchDept && matchStatus;
    });
  }, [students, selectedDept, selectedStatus]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  // Current page items
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  // Handle department filter change
  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Handle direct select jump
  const handleJumpSelect = (studentId: string) => {
    if (!studentId) return;
    onSelectStudent(studentId);
    // Find what page this student is on in the filtered list
    const index = filteredList.findIndex((s) => s.student_id === studentId);
    if (index !== -1) {
      setCurrentPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Student Records Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No records match your query. Clear search or add a new student to the database.
        </p>
        <button
          onClick={onAddStudent}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
        >
          Add New Student
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Directory ({students.length} Total Records)
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200/60 dark:border-indigo-800">
              @viva-technology.org Enforced
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {filteredList.length} filtered students across cohorts
          </p>
        </div>

        {/* Quick Jump Dropdown and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline">Jump to:</span>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => handleJumpSelect(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[200px] truncate"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.roll_no} - {s.full_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => db.resetToSeedData()}
            title="Reload full 105 students dataset"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset 105 Cohort</span>
          </button>

          <button
            onClick={onAddStudent}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-2xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Pagination Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Department Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {departments.map((dept) => {
            const isDeptActive = selectedDept === dept;
            const label = dept === 'ALL' ? 'All Depts' : dept.replace('Engineering', 'Eng.').replace('Artificial Intelligence & Data Science', 'AI & DS').replace('Electronics & Communication', 'ECE');
            return (
              <button
                key={dept}
                onClick={() => handleDeptChange(dept)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isDeptActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 self-start sm:self-auto shrink-0">
          <button
            onClick={() => handleStatusChange('ALL')}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusChange('ACTIVE')}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              selectedStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusChange('GAP')}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              selectedStatus === 'GAP'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Gap Year
          </button>
        </div>
      </div>

      {/* Grid of Student Cards (Paginated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {paginatedStudents.map((student) => {
          const isSelected = student.student_id === selectedStudentId;
          const studentSemesters = db.getSemesters(student.student_id);
          const studentGaps = db.getGaps(student.student_id);
          const hasGap = student.status === 'Academic Gap / Drop' || studentGaps.length > 0;
          const latestSem = studentSemesters[studentSemesters.length - 1];
          const cgpa = latestSem?.cgpa ?? 0;

          return (
            <button
              key={student.student_id}
              onClick={() => onSelectStudent(student.student_id)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate block">
                    {student.full_name}
                  </span>
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
                    <span>{student.roll_no}</span>
                  </div>
                </div>

                {/* CGPA Badge */}
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                      cgpa >= 8.5
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : cgpa >= 7.0
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {cgpa.toFixed(2)} CGPA
                  </span>
                </div>
              </div>

              {/* Email representation strictly viva-technology.org */}
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{student.email}</span>
              </div>

              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {student.department}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Sem {student.current_semester} • {student.batch_year} Batch
                </span>
                {hasGap ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    Gap Year
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Regular</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Page {currentPage} of {totalPages} ({(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} of {filteredList.length})
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
