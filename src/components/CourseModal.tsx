import React, { useState, useEffect } from 'react';
import { SemesterCourse, CourseType } from '../types/schema';
import { calculateGrade } from '../db/calculations';
import { validateCourse } from '../db/validation';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  semesterId: string;
  studentId: string;
  defaultType?: CourseType;
  course: SemesterCourse | null; // null for add, object for edit
  onClose: () => void;
  onSave: (data: Partial<SemesterCourse>) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  semesterId,
  studentId,
  defaultType = 'Theory',
  course,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<SemesterCourse>>({
    course_code: '',
    course_name: '',
    course_type: defaultType,
    credits: 3,
    internal_marks: 30,
    external_marks: 45,
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        course_code: defaultType === 'Lab' ? 'CS591' : 'CS501',
        course_name: defaultType === 'Lab' ? 'DBMS Laboratory' : 'Database Management Systems',
        course_type: defaultType,
        credits: defaultType === 'Lab' ? 2 : 4,
        internal_marks: defaultType === 'Lab' ? 35 : 32,
        external_marks: defaultType === 'Lab' ? 52 : 48,
      });
    }
    setErrors([]);
  }, [course, defaultType, isOpen]);

  if (!isOpen) return null;

  const currentInternal = formData.internal_marks ?? 0;
  const currentExternal = formData.external_marks ?? 0;
  const totalMarks = currentInternal + currentExternal;
  const { gradeLetter, gradePoint } = calculateGrade(totalMarks);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<SemesterCourse> = {
      ...formData,
      semester_id: semesterId,
      student_id: studentId,
      total_marks: totalMarks,
      grade_letter: gradeLetter,
      grade_point: gradePoint,
      status: gradePoint >= 5 ? 'Passed' : 'Backlog',
    };

    const valErrors = validateCourse(payload);
    if (valErrors.length > 0) {
      setErrors(valErrors.map((err) => `${err.field}: ${err.message}`));
      return;
    }
    onSave(payload);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="course-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {course ? 'Edit Course / Lab Marks' : 'Add Subject / Lab Practical'}
              </h2>
              <p className="text-xs text-slate-500">
                Enforces CHECK constraints (internal &le; 40, external &le; 60, total &le; 100)
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Schema Constraint Violations:
              </div>
              <ul className="list-disc pl-5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.course_code || ''}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                placeholder="e.g. CS501"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Classification *
              </label>
              <select
                value={formData.course_type || 'Theory'}
                onChange={(e) => setFormData({ ...formData, course_type: e.target.value as CourseType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Theory">Theory Subject</option>
                <option value="Lab">Laboratory Practical</option>
                <option value="Project">Capstone / Mini Project</option>
                <option value="Seminar">Academic Technical Seminar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.course_name || ''}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              placeholder="e.g. Database Management Systems"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credits (1-10) *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={formData.credits || 3}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal (0-40) *
              </label>
              <input
                type="number"
                min={0}
                max={40}
                required
                value={formData.internal_marks ?? 0}
                onChange={(e) => setFormData({ ...formData, internal_marks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                External (0-60) *
              </label>
              <input
                type="number"
                min={0}
                max={60}
                required
                value={formData.external_marks ?? 0}
                onChange={(e) => setFormData({ ...formData, external_marks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Automatic Grade Computation Preview Card */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Total Marks:</span>{' '}
              <strong className="text-slate-900 dark:text-slate-100 text-sm font-mono">{totalMarks} / 100</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Result:</span>
              <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                gradePoint >= 5
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                Grade: {gradeLetter} ({gradePoint} pts) • {gradePoint >= 5 ? 'Passed' : 'Backlog'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {course ? 'Update Course Marks' : 'Save Subject'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
