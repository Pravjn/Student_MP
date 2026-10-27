import React from 'react';
import { AcademicSemester, AcademicGapRecord, Student } from '../types/schema';
import {
  Calendar,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  Clock,
  Sparkles,
  Milestone
} from 'lucide-react';

interface AcademicMilestoneTimelineProps {
  student: Student;
  semesters: AcademicSemester[];
  gaps: AcademicGapRecord[];
}

export const AcademicMilestoneTimeline: React.FC<AcademicMilestoneTimelineProps> = ({
  student,
  semesters,
  gaps,
}) => {
  const sortedSemesters = [...semesters].sort((a, b) => a.semester_number - b.semester_number);

  // Build sequential timeline events
  interface TimelineEvent {
    id: string;
    type: 'school_10' | 'school_12' | 'semester' | 'gap_year';
    title: string;
    subtitle: string;
    year: string;
    status: 'completed' | 'current' | 'gap' | 'planned';
    badge: string;
    score?: string;
    details?: string;
  }

  const events: TimelineEvent[] = [
    {
      id: '10th',
      type: 'school_10',
      title: 'Secondary (10th)',
      subtitle: student.secondary_board,
      year: String(student.secondary_passing_year),
      status: 'completed',
      badge: `${student.secondary_percentage}%`,
      score: 'Board Exam Cleared',
    },
    {
      id: '12th',
      type: 'school_12',
      title: 'Higher Sec (12th)',
      subtitle: `${student.higher_sec_board} • ${student.higher_sec_stream}`,
      year: String(student.higher_sec_passing_year),
      status: 'completed',
      badge: `${student.higher_sec_percentage}%`,
      score: 'College Admission',
    },
  ];

  // Insert semesters and gap years in chronological order
  for (const sem of sortedSemesters) {
    // If this semester has a gap year recorded, insert gap event first
    if (sem.has_drop_year) {
      const matchingGap = gaps.find((g) => g.academic_year_affected === sem.academic_year);
      events.push({
        id: `gap-${sem.semester_id}`,
        type: 'gap_year',
        title: matchingGap ? matchingGap.gap_type : 'Academic Drop / Gap Year',
        subtitle: matchingGap ? matchingGap.reason : (sem.drop_reason || 'Interrupted progression'),
        year: sem.academic_year,
        status: 'gap',
        badge: matchingGap ? `${matchingGap.duration_years} Yr Gap` : 'Gap Year',
        details: matchingGap ? `Approved by ${matchingGap.approved_by} [${matchingGap.clearance_status}]` : 'Dean Approved',
      });
    }

    const isCurrent = sem.semester_number === student.current_semester;
    events.push({
      id: `sem-${sem.semester_id}`,
      type: 'semester',
      title: `Semester ${sem.semester_number}`,
      subtitle: `${sem.earned_credits}/${sem.total_credits} Credits`,
      year: sem.academic_year,
      status: isCurrent ? 'current' : (sem.sgpa > 0 ? 'completed' : 'planned'),
      badge: sem.sgpa > 0 ? `${sem.sgpa.toFixed(2)} SGPA` : 'Pending',
      score: sem.cgpa > 0 ? `CGPA: ${sem.cgpa.toFixed(2)}` : undefined,
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Milestone className="w-4 h-4 text-indigo-600" />
            Visual Academic Milestones & Gap Year Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological progression from 10th & 12th schooling through semesters, highlighting academic drops and gap years.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Cleared Semesters
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-pulse" />
            Academic Gap Years
          </span>
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            Current Semester
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div className="relative pt-6 pb-2 overflow-x-auto scrollbar-none">
        
        {/* Connecting Line */}
        <div className="absolute top-10 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />

        <div className="flex items-start gap-4 min-w-[700px] px-2 relative z-10">
          {events.map((ev, idx) => {
            const isGap = ev.type === 'gap_year';
            const isCurrent = ev.status === 'current';
            const isSchool = ev.type === 'school_10' || ev.type === 'school_12';

            return (
              <div
                key={ev.id}
                className="flex-1 min-w-[130px] flex flex-col items-center text-center group"
              >
                {/* Node Icon Indicator */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-transform shadow-md ${
                    isGap
                      ? 'bg-amber-500 text-white ring-4 ring-amber-200 dark:ring-amber-950 scale-110 animate-bounce'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-950 scale-105'
                      : isSchool
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                  }`}
                >
                  {isGap ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isSchool ? (
                    <GraduationCap className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                {/* Event Year Label */}
                <span className="mt-2 text-[10px] font-mono text-slate-400">
                  {ev.year}
                </span>

                {/* Event Card */}
                <div
                  className={`mt-1.5 p-2.5 rounded-xl border w-full transition-all ${
                    isGap
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                      : isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {ev.subtitle}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isGap
                          ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                          : isCurrent
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {ev.badge}
                    </span>
                  </div>

                  {ev.details && (
                    <div className="mt-1 text-[9px] text-amber-700 dark:text-amber-300 line-clamp-2">
                      {ev.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
