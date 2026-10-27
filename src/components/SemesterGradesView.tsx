import React, { useState } from 'react';
import { AcademicSemester, SemesterCourse } from '../types/schema';
import { db } from '../db/relationalStore';
import {
  BookOpen,
  FlaskConical,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SemesterGradesViewProps {
  semesters: AcademicSemester[];
  activeSemesterId: string | null;
  onSelectSemester: (semesterId: string) => void;
  onOpenAddCourse: (semesterId: string, defaultType?: 'Theory' | 'Lab') => void;
  onOpenEditCourse: (course: SemesterCourse) => void;
  onRequestDeleteCourse: (course: SemesterCourse) => void;
}

export const SemesterGradesView: React.FC<SemesterGradesViewProps> = ({
  semesters,
  activeSemesterId,
  onSelectSemester,
  onOpenAddCourse,
  onOpenEditCourse,
  onRequestDeleteCourse,
}) => {
  const sortedSemesters = [...semesters].sort((a, b) => a.semester_number - b.semester_number);
  const currentSemester = sortedSemesters.find((s) => s.semester_id === activeSemesterId) || sortedSemesters[0];

  const currentCourses = currentSemester ? db.getCourses(currentSemester.semester_id) : [];
  const theoryCourses = currentCourses.filter((c) => c.course_type === 'Theory');
  const labCourses = currentCourses.filter((c) => c.course_type === 'Lab' || c.course_type === 'Project' || c.course_type === 'Seminar');

  if (sortedSemesters.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Semesters Configured</h3>
        <p className="text-xs text-slate-500 mt-1">This student has no semester records.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      
      {/* Header & Semester Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Semester Academic Records & Marks
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              3NF Courses & Labs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theory examinations (out of 60) + internal assessments (out of 40) + laboratory practicals.
          </p>
        </div>

        {/* Action Button */}
        {currentSemester && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddCourse(currentSemester.semester_id, 'Theory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Theory Subject
            </button>
            <button
              onClick={() => onOpenAddCourse(currentSemester.semester_id, 'Lab')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Lab Practical
            </button>
          </div>
        )}
      </div>

      {/* Semester Selector Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
        {sortedSemesters.map((sem) => {
          const isActive = sem.semester_id === currentSemester?.semester_id;
          return (
            <button
              key={sem.semester_id}
              onClick={() => onSelectSemester(sem.semester_id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">Semester {sem.semester_number}</span>
                {sem.has_drop_year && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                    GAP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] opacity-90">
                <span className="font-mono">{sem.academic_year}</span>
                <span className="font-bold">• {sem.sgpa > 0 ? `${sem.sgpa.toFixed(2)} SGPA` : 'Pending'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {currentSemester && (
        <div className="mt-4 space-y-6">
          
          {/* Semester Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Semester {currentSemester.semester_number} Summary
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400">
                Academic Year: <strong className="text-slate-800 dark:text-slate-200">{currentSemester.academic_year}</strong>
              </span>
              {currentSemester.has_drop_year && (
                <span className="text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  ⚠️ {currentSemester.drop_reason || 'Academic Gap Year'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold">
                SGPA: {currentSemester.sgpa.toFixed(2)} / 10.00
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium">
                Earned: {currentSemester.earned_credits} / {currentSemester.total_credits} Credits
              </span>
            </div>
          </div>

          {/* Section 1: Theory Subjects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Theory Courses ({theoryCourses.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Continuous Internal Assessment (40) + Semester End Exam (60)
              </span>
            </div>

            {theoryCourses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No theory subjects recorded for Semester {currentSemester.semester_number}.
                <button
                  onClick={() => onOpenAddCourse(currentSemester.semester_id, 'Theory')}
                  className="ml-2 font-medium text-indigo-600 hover:underline"
                >
                  Add a subject now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-3.5 py-2.5">Code</th>
                      <th className="px-3.5 py-2.5">Course Name</th>
                      <th className="px-3.5 py-2.5 text-center">Credits</th>
                      <th className="px-3.5 py-2.5 text-center">Internal (40)</th>
                      <th className="px-3.5 py-2.5 text-center">External (60)</th>
                      <th className="px-3.5 py-2.5 text-center">Total (100)</th>
                      <th className="px-3.5 py-2.5 text-center">Grade</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {theoryCourses.map((c) => (
                      <tr key={c.course_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {c.course_code}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                          {c.course_name}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold">
                          {c.credits}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                          {c.internal_marks}/40
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                          {c.external_marks}/60
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                          {c.total_marks}/100
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            c.grade_letter === 'O' || c.grade_letter === 'E'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : c.grade_letter === 'A' || c.grade_letter === 'B'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : c.grade_letter === 'F'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {c.grade_letter} ({c.grade_point} pts)
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {c.status === 'Passed' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Backlog
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditCourse(c)}
                              aria-label={`Edit ${c.course_code}`}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRequestDeleteCourse(c)}
                              aria-label={`Delete ${c.course_code}`}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Laboratory Practicals & Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-500" />
                Laboratory Practicals & Technical Workshops ({labCourses.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Practical Exam + Lab Viva + Project Evaluation
              </span>
            </div>

            {labCourses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No lab practicals recorded for Semester {currentSemester.semester_number}.
                <button
                  onClick={() => onOpenAddCourse(currentSemester.semester_id, 'Lab')}
                  className="ml-2 font-medium text-indigo-600 hover:underline"
                >
                  Add a practical lab
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-3.5 py-2.5">Code</th>
                      <th className="px-3.5 py-2.5">Lab Title / Practical</th>
                      <th className="px-3.5 py-2.5 text-center">Credits</th>
                      <th className="px-3.5 py-2.5 text-center">Continuous (40)</th>
                      <th className="px-3.5 py-2.5 text-center">Viva / Exam (60)</th>
                      <th className="px-3.5 py-2.5 text-center">Total (100)</th>
                      <th className="px-3.5 py-2.5 text-center">Grade</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {labCourses.map((c) => (
                      <tr key={c.course_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-violet-600 dark:text-violet-400">
                          {c.course_code}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                          {c.course_name}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold">
                          {c.credits}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                          {c.internal_marks}/40
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                          {c.external_marks}/60
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                          {c.total_marks}/100
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            c.grade_letter === 'O' || c.grade_letter === 'E'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {c.grade_letter} ({c.grade_point} pts)
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Passed
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditCourse(c)}
                              aria-label={`Edit ${c.course_code}`}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRequestDeleteCourse(c)}
                              aria-label={`Delete ${c.course_code}`}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
