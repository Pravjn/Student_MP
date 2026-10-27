import React, { useState } from 'react';
import { AcademicGapRecord } from '../types/schema';
import { X, ShieldAlert } from 'lucide-react';

interface GapModalProps {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
  onSave: (data: Partial<AcademicGapRecord>) => void;
}

export const GapModal: React.FC<GapModalProps> = ({
  isOpen,
  studentId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<AcademicGapRecord>>({
    gap_type: 'Medical Leave',
    academic_year_affected: '2023-2024',
    duration_years: 1,
    reason: '',
    approved_by: 'Dean of Academic Affairs',
    clearance_status: 'Approved',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      student_id: studentId,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gap-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 id="gap-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Record Academic Gap / Drop Year
              </h2>
              <p className="text-xs text-slate-500">
                Logs official academic interruptions with justification and clearance
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interruption Classification *
            </label>
            <select
              value={formData.gap_type || 'Medical Leave'}
              onChange={(e) => setFormData({ ...formData, gap_type: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="Pre-College Gap">Pre-College Preparation Gap</option>
              <option value="Mid-Course Drop Year">Mid-Course Academic Drop Year</option>
              <option value="Medical Leave">Authorized Medical Leave</option>
              <option value="Semester Repeat">Semester Repetition / Year-Back</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Year Affected *
              </label>
              <input
                type="text"
                required
                value={formData.academic_year_affected || ''}
                onChange={(e) => setFormData({ ...formData, academic_year_affected: e.target.value })}
                placeholder="e.g. 2022-2023"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Years) *
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                max={4}
                required
                value={formData.duration_years || 1}
                onChange={(e) => setFormData({ ...formData, duration_years: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason & Medical / Academic Justification *
            </label>
            <textarea
              required
              rows={2}
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Underwent surgical rehabilitation followed by 6 months medical rest."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approving Authority *
              </label>
              <input
                type="text"
                required
                value={formData.approved_by || ''}
                onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                placeholder="e.g. Dean of Academics"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clearance Status
              </label>
              <select
                value={formData.clearance_status || 'Approved'}
                onChange={(e) => setFormData({ ...formData, clearance_status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="Approved">Approved & Cleared</option>
                <option value="Under Review">Under Review</option>
                <option value="Cleared">Cleared with Backlogs</option>
              </select>
            </div>
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Gap Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
