import React, { useState } from 'react';
import { AcademicSemester, SemesterCourse, StudentSeminar, StudentActivity, AcademicGapRecord } from '../types/schema';
import {
  TrendingUp,
  Award,
  BookOpen,
  FlaskConical,
  AlertCircle,
  FileBadge
} from 'lucide-react';

interface AnalyticsOverviewProps {
  semesters: AcademicSemester[];
  courses: SemesterCourse[];
  seminars: StudentSeminar[];
  activities: StudentActivity[];
  gaps: AcademicGapRecord[];
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  semesters,
  courses,
  seminars,
  activities,
  gaps,
}) => {
  const [hoveredSemIndex, setHoveredSemIndex] = useState<number | null>(null);

  const sortedSemesters = [...semesters].sort((a, b) => a.semester_number - b.semester_number);
  const latestSem = sortedSemesters[sortedSemesters.length - 1];
  const overallCGPA = latestSem?.cgpa ?? 0;

  const totalCredits = sortedSemesters.reduce((acc, s) => acc + (s.total_credits || 0), 0);
  const earnedCredits = sortedSemesters.reduce((acc, s) => acc + (s.earned_credits || 0), 0);

  const theoryCourses = courses.filter((c) => c.course_type === 'Theory');
  const labCourses = courses.filter((c) => c.course_type === 'Lab');

  const avgTheoryMarks = theoryCourses.length > 0
    ? (theoryCourses.reduce((acc, c) => acc + c.total_marks, 0) / theoryCourses.length).toFixed(1)
    : 'N/A';

  const avgLabMarks = labCourses.length > 0
    ? (labCourses.reduce((acc, c) => acc + c.total_marks, 0) / labCourses.length).toFixed(1)
    : 'N/A';

  const activeBacklogs = courses.filter((c) => c.status === 'Backlog').length;

  const internalSeminarsCount = seminars.filter((s) => s.seminar_type === 'INTERNAL').length;
  const externalSeminarsCount = seminars.filter((s) => s.seminar_type === 'EXTERNAL').length;

  const coCurricularCount = activities.filter((a) => a.activity_class === 'TECHNICAL_CO_CURRICULAR').length;
  const extraCurricularCount = activities.filter((a) => a.activity_class === 'EXTRA_CURRICULAR').length;

  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 60;
  const paddingY = 40;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(10, val));
    return svgHeight - paddingY - (clamped / 10) * chartHeight;
  };

  const getX = (index: number) => {
    if (sortedSemesters.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (sortedSemesters.length - 1)) * chartWidth;
  };

  const sgpaPoints = sortedSemesters.map((s, i) => ({ x: getX(i), y: getY(s.sgpa), sem: s }));
  const cgpaPoints = sortedSemesters.map((s, i) => ({ x: getX(i), y: getY(s.cgpa), sem: s }));

  const sgpaPathD = sgpaPoints.length > 0
    ? sgpaPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : '';

  const cgpaPathD = cgpaPoints.length > 0
    ? cgpaPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : '';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Cumulative CGPA</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {overallCGPA.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">/ 10.00</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Grading Scale: 10-point
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Credits Earned</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {earnedCredits}
            </span>
            <span className="text-xs text-slate-400">/ {totalCredits}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {totalCredits > 0 ? `${Math.round((earnedCredits / totalCredits) * 100)}% accumulated` : '0%'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Theory Avg</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {avgTheoryMarks}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {theoryCourses.length} Theory Subjects
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Lab Practical Avg</span>
            <FlaskConical className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {avgLabMarks}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {labCourses.length} Lab Practicals
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Active Backlogs</span>
            <AlertCircle className={`w-4 h-4 ${activeBacklogs > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${activeBacklogs > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
              {activeBacklogs}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activeBacklogs === 0 ? 'All subjects cleared' : 'Action needed'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Portfolios</span>
            <FileBadge className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {seminars.length} Seminars ({internalSeminarsCount} Int / {externalSeminarsCount} Ext)
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activities.length} Activities ({coCurricularCount} Tech / {extraCurricularCount} Extra)
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Dynamic Semester Progression Curve (SGPA / CGPA)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracks semester-wise performance curve, GPA trends, and highlights academic drop or gap years.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-indigo-600 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">SGPA Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Cumulative CGPA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-pulse" />
              <span className="text-amber-700 dark:text-amber-400 font-semibold">Drop / Gap Year</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 select-none"
            aria-label="Semester Progression Curve Chart"
          >
            {[0, 2, 4, 6, 8, 10].map((gpa) => {
              const y = getY(gpa);
              return (
                <g key={gpa}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    strokeDasharray={gpa === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={paddingX - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {gpa.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {sortedSemesters.map((sem, i) => {
              if (!sem.has_drop_year) return null;
              const x = getX(i);
              return (
                <g key={`gap-zone-${sem.semester_id}`}>
                  <rect
                    x={x - 24}
                    y={paddingY}
                    width={48}
                    height={chartHeight}
                    fill="currentColor"
                    className="text-amber-400/10 dark:text-amber-500/15"
                    rx={6}
                  />
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={svgHeight - paddingY}
                    stroke="currentColor"
                    className="text-amber-500"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={x - 36}
                    y={paddingY - 24}
                    width={72}
                    height={18}
                    rx={4}
                    fill="#f59e0b"
                  />
                  <text
                    x={x}
                    y={paddingY - 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    className="text-[9px] font-bold"
                  >
                    GAP YEAR
                  </text>
                </g>
              );
            })}

            {sgpaPathD && (
              <path
                d={sgpaPathD}
                fill="none"
                stroke="#4f46e5"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {cgpaPathD && (
              <path
                d={cgpaPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {sortedSemesters.map((sem, i) => {
              const x = getX(i);
              const ySgpa = getY(sem.sgpa);
              const isHovered = hoveredSemIndex === i;

              return (
                <g
                  key={sem.semester_id}
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setHoveredSemIndex(i)}
                  onMouseLeave={() => setHoveredSemIndex(null)}
                >
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={svgHeight - paddingY}
                      stroke="#6366f1"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  )}

                  {sem.has_drop_year ? (
                    <circle
                      cx={x}
                      cy={ySgpa}
                      r={isHovered ? 8 : 6}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="filter drop-shadow"
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={ySgpa}
                      r={isHovered ? 6 : 4.5}
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  )}

                  <text
                    x={x}
                    y={svgHeight - paddingY + 20}
                    textAnchor="middle"
                    className={`text-xs font-semibold ${isHovered ? 'fill-indigo-600 font-bold' : 'fill-slate-600 dark:fill-slate-400'}`}
                  >
                    Sem {sem.semester_number}
                  </text>
                  <text
                    x={x}
                    y={svgHeight - paddingY + 34}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {sem.academic_year}
                  </text>
                </g>
              );
            })}
          </svg>

          {hoveredSemIndex !== null && sortedSemesters[hoveredSemIndex] && (
            <div
              className="absolute z-20 pointer-events-none p-3 rounded-lg bg-slate-900 text-white shadow-xl border border-slate-700 text-xs w-48 -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(getX(hoveredSemIndex) / svgWidth) * 100}%`,
                top: `${(getY(sortedSemesters[hoveredSemIndex].sgpa) / svgHeight) * 100}%`,
              }}
            >
              <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
                <span>Semester {sortedSemesters[hoveredSemIndex].semester_number}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {sortedSemesters[hoveredSemIndex].academic_year}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">SGPA:</span>
                <span className="font-bold text-indigo-400 font-mono">
                  {sortedSemesters[hoveredSemIndex].sgpa.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">CGPA:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {sortedSemesters[hoveredSemIndex].cgpa.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">Credits:</span>
                <span className="font-mono">
                  {sortedSemesters[hoveredSemIndex].earned_credits} / {sortedSemesters[hoveredSemIndex].total_credits}
                </span>
              </div>
              {sortedSemesters[hoveredSemIndex].has_drop_year && (
                <div className="mt-1 pt-1 border-t border-amber-500/40 text-[10px] text-amber-300">
                  <span className="font-bold">Drop/Gap Year:</span>{' '}
                  {sortedSemesters[hoveredSemIndex].drop_reason || 'Academic Gap recorded'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
