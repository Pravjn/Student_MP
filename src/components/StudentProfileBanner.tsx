import React from 'react';
import { Student, AcademicGapRecord } from '../types/schema';
import {
  GraduationCap,
  Mail,
  Phone,
  Building,
  Calendar,
  Award,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  FileText
} from 'lucide-react';

interface StudentProfileBannerProps {
  student: Student;
  gaps: AcademicGapRecord[];
  onEditStudent: () => void;
  onDeleteStudent: () => void;
  onOpenGapModal: () => void;
}

export const StudentProfileBanner: React.FC<StudentProfileBannerProps> = ({
  student,
  gaps,
  onEditStudent,
  onDeleteStudent,
  onOpenGapModal,
}) => {
  const hasGap = student.status === 'Academic Gap / Drop' || gaps.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Top Banner Accent */}
      <div className="h-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Identity & Basic Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {student.full_name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {student.roll_no}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    hasGap
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {hasGap ? 'Academic Gap Year Flagged' : 'Active Student'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {student.department}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Batch {student.batch_year} • Semester {student.current_semester}
                </span>
                <span className="flex items-center gap-1 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {student.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              onClick={onOpenGapModal}
              title="Record or update drop/gap years for this student"
              className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors cursor-pointer"
            >
              Manage Gap Years
            </button>
            <button
              onClick={onEditStudent}
              title="Edit student profile"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteStudent}
              title="Delete student (cascades to all semester grades, portfolios & gap records)"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary & Higher Secondary (10th & 12th) Academic Records */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Secondary 10th Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              10th
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Secondary School Examination
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {student.secondary_percentage}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {student.secondary_board} • Passing Year: {student.secondary_passing_year}
              </p>
            </div>
          </div>

          {/* Higher Secondary 12th Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs shrink-0">
              12th
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Higher Secondary Examination
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {student.higher_sec_percentage}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {student.higher_sec_board} • {student.higher_sec_stream} ({student.higher_sec_passing_year})
              </p>
            </div>
          </div>

        </div>

        {/* Academic Gap / Drop Year Alert Indicator Banner */}
        {hasGap && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Academic Drop / Gap Year Recorded:
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-300">
                {gaps.length > 0
                  ? gaps.map((g) => `${g.gap_type} during ${g.academic_year_affected} (${g.reason}) - ${g.approved_by} [Status: ${g.clearance_status}]`).join(' | ')
                  : 'Student has a drop year logged in semester progression.'}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
