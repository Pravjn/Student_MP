import React, { useState, useEffect } from 'react';
import { StudentSeminar, SeminarType, SeminarRole } from '../types/schema';
import { X, FileBadge, AlertCircle } from 'lucide-react';
import { validateSeminar } from '../db/validation';

interface SeminarModalProps {
  isOpen: boolean;
  studentId: string;
  seminar: StudentSeminar | null;
  onClose: () => void;
  onSave: (data: Partial<StudentSeminar>) => void;
}

export const SeminarModal: React.FC<SeminarModalProps> = ({
  isOpen,
  studentId,
  seminar,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<StudentSeminar>>({
    seminar_type: 'INTERNAL',
    title: '',
    venue_or_organizer: '',
    date_conducted: new Date().toISOString().split('T')[0],
    role: 'Presenter',
    certificate_ref: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (seminar) {
      setFormData(seminar);
    } else {
      setFormData({
        seminar_type: 'INTERNAL',
        title: '',
        venue_or_organizer: 'Department Seminar Hall',
        date_conducted: new Date().toISOString().split('T')[0],
        role: 'Presenter',
        certificate_ref: `CERT-${Date.now().toString().slice(-6)}`,
        remarks: '',
      });
    }
    setErrors([]);
  }, [seminar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<StudentSeminar> = {
      ...formData,
      student_id: studentId,
    };

    const valErrors = validateSeminar(payload);
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
      aria-labelledby="seminar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <h2 id="seminar-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {seminar ? 'Edit Seminar Record' : 'Record Seminar Entry'}
              </h2>
              <p className="text-xs text-slate-500">
                Segregated Portfolio: Internal (Departmental) vs External (Conferences)
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
          {errors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              <ul className="list-disc pl-4 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seminar Type *
              </label>
              <select
                value={formData.seminar_type || 'INTERNAL'}
                onChange={(e) => setFormData({ ...formData, seminar_type: e.target.value as SeminarType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="INTERNAL">INTERNAL (College / Dept)</option>
                <option value="EXTERNAL">EXTERNAL (Conference / Symposia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Role *
              </label>
              <select
                value={formData.role || 'Presenter'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as SeminarRole })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="Presenter">Presenter / Speaker</option>
                <option value="Attendee">Attendee / Delegate</option>
                <option value="Keynote Student Speaker">Keynote Student Speaker</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic / Seminar Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Scalable Graph Databases & RDF Triplestores"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue or Organizer *
              </label>
              <input
                type="text"
                required
                value={formData.venue_or_organizer || ''}
                onChange={(e) => setFormData({ ...formData, venue_or_organizer: e.target.value })}
                placeholder="e.g. IEEE Bangalore Chapter"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Conducted *
              </label>
              <input
                type="date"
                required
                value={formData.date_conducted || ''}
                onChange={(e) => setFormData({ ...formData, date_conducted: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Certificate Reference / URL
            </label>
            <input
              type="text"
              value={formData.certificate_ref || ''}
              onChange={(e) => setFormData({ ...formData, certificate_ref: e.target.value })}
              placeholder="e.g. CERT-IEEE-2024-SP98"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks & Presentation Notes
            </label>
            <textarea
              rows={2}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Key takeaways or faculty evaluation notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {seminar ? 'Update Seminar' : 'Record Seminar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
