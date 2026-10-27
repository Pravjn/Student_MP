import React, { useState, useEffect } from 'react';
import { Student } from '../types/schema';
import { X, GraduationCap, AlertCircle } from 'lucide-react';
import { validateStudent } from '../db/validation';

interface StudentModalProps {
  isOpen: boolean;
  student: Student | null; // null for add, object for edit
  onClose: () => void;
  onSave: (data: Partial<Student>) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    roll_no: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Computer Science & Engineering',
    batch_year: 2022,
    current_semester: 1,
    status: 'Active',
    secondary_board: 'CBSE',
    secondary_percentage: 85,
    secondary_passing_year: 2020,
    higher_sec_board: 'CBSE',
    higher_sec_percentage: 85,
    higher_sec_stream: 'Science (PCM)',
    higher_sec_passing_year: 2022,
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (student) {
      setFormData(student);
    } else {
      setFormData({
        roll_no: `2023CSE0${Math.floor(10 + Math.random() * 89)}`,
        full_name: '',
        email: '',
        phone: '',
        department: 'Computer Science & Engineering',
        batch_year: 2023,
        current_semester: 1,
        status: 'Active',
        secondary_board: 'CBSE',
        secondary_percentage: 88.5,
        secondary_passing_year: 2021,
        higher_sec_board: 'CBSE',
        higher_sec_percentage: 86.0,
        higher_sec_stream: 'Science (PCM)',
        higher_sec_passing_year: 2023,
      });
    }
    setErrors([]);
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valErrors = validateStudent(formData);
    if (valErrors.length > 0) {
      setErrors(valErrors.map((err) => `${err.field}: ${err.message}`));
      return;
    }
    onSave(formData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 id="student-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {student ? 'Edit Student Profile' : 'Enroll New Student'}
              </h2>
              <p className="text-xs text-slate-500">
                Normalized 3NF Profile with Secondary and Higher Secondary grades
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Relational Constraint Violations:
              </div>
              <ul className="list-disc pl-5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Vikramaditya Sen"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University Roll Number * (Unique)
              </label>
              <input
                type="text"
                required
                value={formData.roll_no || ''}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                placeholder="e.g. 2022CSE088"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email * (@viva-technology.org only)
              </label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. 123@viva-technology.org"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Strict DB constraint: Must end with <strong className="text-indigo-600 dark:text-indigo-400">@viva-technology.org</strong> (e.g. 123@viva-technology.org). Other domains are rejected.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={formData.department || 'Computer Science & Engineering'}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Year
                </label>
                <input
                  type="number"
                  min={2018}
                  max={2030}
                  value={formData.batch_year || 2022}
                  onChange={(e) => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Sem (1-8)
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={formData.current_semester || 1}
                  onChange={(e) => setFormData({ ...formData, current_semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Secondary 10th Record */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Secondary (10th Standard) Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Board of Education
                </label>
                <input
                  type="text"
                  value={formData.secondary_board || ''}
                  onChange={(e) => setFormData({ ...formData, secondary_board: e.target.value })}
                  placeholder="CBSE / ICSE / State"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Marks % (0-100)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={formData.secondary_percentage || 0}
                  onChange={(e) => setFormData({ ...formData, secondary_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Passing Year
                </label>
                <input
                  type="number"
                  value={formData.secondary_passing_year || 2020}
                  onChange={(e) => setFormData({ ...formData, secondary_passing_year: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Higher Secondary 12th Record */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Higher Secondary (12th Standard) Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Board
                </label>
                <input
                  type="text"
                  value={formData.higher_sec_board || ''}
                  onChange={(e) => setFormData({ ...formData, higher_sec_board: e.target.value })}
                  placeholder="CBSE / ISC / State"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Marks % (0-100)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={formData.higher_sec_percentage || 0}
                  onChange={(e) => setFormData({ ...formData, higher_sec_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Stream
                </label>
                <input
                  type="text"
                  value={formData.higher_sec_stream || ''}
                  onChange={(e) => setFormData({ ...formData, higher_sec_stream: e.target.value })}
                  placeholder="Science (PCM)"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Passing Year
                </label>
                <input
                  type="number"
                  value={formData.higher_sec_passing_year || 2022}
                  onChange={(e) => setFormData({ ...formData, higher_sec_passing_year: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              {student ? 'Save Changes' : 'Enroll Student'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
