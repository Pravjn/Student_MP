import React, { useState } from 'react';
import { SemesterCourse, AcademicSemester } from '../types/schema';
import { BarChart3, FlaskConical, BookOpen, CheckCircle, Percent } from 'lucide-react';

interface PerformanceComparisonChartProps {
  semesters: AcademicSemester[];
  courses: SemesterCourse[];
}

export const PerformanceComparisonChart: React.FC<PerformanceComparisonChartProps> = ({
  semesters,
  courses,
}) => {
  const [hoveredSem, setHoveredSem] = useState<string | null>(null);

  const sortedSemesters = [...semesters].sort((a, b) => a.semester_number - b.semester_number);

  // Calculate per-semester theory vs lab averages
  const semesterData = sortedSemesters.map((sem) => {
    const semCourses = courses.filter((c) => c.semester_id === sem.semester_id);
    const theoryCourses = semCourses.filter((c) => c.course_type === 'Theory');
    const labCourses = semCourses.filter((c) => c.course_type === 'Lab' || c.course_type === 'Project');

    const theoryAvg = theoryCourses.length > 0
      ? theoryCourses.reduce((acc, c) => acc + c.total_marks, 0) / theoryCourses.length
      : 0;

    const labAvg = labCourses.length > 0
      ? labCourses.reduce((acc, c) => acc + c.total_marks, 0) / labCourses.length
      : 0;

    const internalAvg = semCourses.length > 0
      ? (semCourses.reduce((acc, c) => acc + (c.internal_marks / 40) * 100, 0) / semCourses.length)
      : 0;

    return {
      semester: `Sem ${sem.semester_number}`,
      academicYear: sem.academic_year,
      sgpa: sem.sgpa,
      theoryAvg: Number(theoryAvg.toFixed(1)),
      labAvg: Number(labAvg.toFixed(1)),
      internalAvg: Number(internalAvg.toFixed(1)),
      theoryCount: theoryCourses.length,
      labCount: labCourses.length,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Theory Examinations vs. Laboratory Practicals Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compares semester theory marks (out of 100), laboratory practicals (out of 100), and internal assessment percentages.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Theory Subjects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-violet-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Lab Practicals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Internal Continuous %</span>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart Visual */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {semesterData.map((data) => {
            const isHovered = hoveredSem === data.semester;
            const hasData = data.theoryAvg > 0 || data.labAvg > 0;

            return (
              <div
                key={data.semester}
                onMouseEnter={() => setHoveredSem(data.semester)}
                onMouseLeave={() => setHoveredSem(null)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {data.semester}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {data.sgpa > 0 ? `${data.sgpa} SGPA` : 'N/A'}
                  </span>
                </div>

                {hasData ? (
                  <div className="space-y-2 mt-3">
                    {/* Theory Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-500" /> Theory
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {data.theoryAvg > 0 ? `${data.theoryAvg}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, data.theoryAvg)}%` }}
                        />
                      </div>
                    </div>

                    {/* Lab Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <FlaskConical className="w-3 h-3 text-violet-500" /> Lab
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {data.labAvg > 0 ? `${data.labAvg}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, data.labAvg)}%` }}
                        />
                      </div>
                    </div>

                    {/* Internal Assessment % Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-emerald-500" /> Internal
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {data.internalAvg > 0 ? `${data.internalAvg}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, data.internalAvg)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-center text-[10px] text-slate-400">
                    Courses pending for this semester
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
