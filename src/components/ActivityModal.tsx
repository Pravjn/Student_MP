import React, { useState, useEffect } from 'react';
import { StudentActivity, ActivityClass, ActivityCategory, AwardLevel } from '../types/schema';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { validateActivity } from '../db/validation';

interface ActivityModalProps {
  isOpen: boolean;
  studentId: string;
  activity: StudentActivity | null;
  onClose: () => void;
  onSave: (data: Partial<StudentActivity>) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  studentId,
  activity,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<StudentActivity>>({
    activity_class: 'TECHNICAL_CO_CURRICULAR',
    category: 'Hackathon',
    event_name: '',
    achievement_or_award: '1st Place',
    event_date: new Date().toISOString().split('T')[0],
    organizer: '',
    impact_points: 250,
    certificate_ref: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        activity_class: 'TECHNICAL_CO_CURRICULAR',
        category: 'Hackathon',
        event_name: '',
        achievement_or_award: '1st Place',
        event_date: new Date().toISOString().split('T')[0],
        organizer: '',
        impact_points: 300,
        certificate_ref: `ACT-WIN-${Date.now().toString().slice(-6)}`,
      });
    }
    setErrors([]);
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<StudentActivity> = {
      ...formData,
      student_id: studentId,
    };

    const valErrors = validateActivity(payload);
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
      aria-labelledby="activity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="activity-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activity ? 'Edit Activity Record' : 'Record Achievement / Activity'}
              </h2>
              <p className="text-xs text-slate-500">
                Segregated Portfolio: Technical Co-Curricular vs Extra-Curricular
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
                Classification *
              </label>
              <select
                value={formData.activity_class || 'TECHNICAL_CO_CURRICULAR'}
                onChange={(e) => {
                  const val = e.target.value as ActivityClass;
                  setFormData({
                    ...formData,
                    activity_class: val,
                    category: val === 'TECHNICAL_CO_CURRICULAR' ? 'Hackathon' : 'Sports & Athletics',
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="TECHNICAL_CO_CURRICULAR">Technical & Co-Curricular</option>
                <option value="EXTRA_CURRICULAR">Extra-Curricular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category || 'Hackathon'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ActivityCategory })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {formData.activity_class === 'TECHNICAL_CO_CURRICULAR' ? (
                  <>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding Competition">Coding Competition</option>
                    <option value="Paper Presentation">Paper Presentation</option>
                    <option value="Technical Workshop">Technical Workshop</option>
                  </>
                ) : (
                  <>
                    <option value="Sports & Athletics">Sports & Athletics</option>
                    <option value="Cultural & Arts">Cultural & Arts</option>
                    <option value="NSS & Social Outreach">NSS & Social Outreach</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event / Competition Name *
            </label>
            <input
              type="text"
              required
              value={formData.event_name || ''}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              placeholder="e.g. National Smart Mobility Hackathon"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Award / Achievement *
              </label>
              <select
                value={formData.achievement_or_award || '1st Place'}
                onChange={(e) => setFormData({ ...formData, achievement_or_award: e.target.value as AwardLevel })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="1st Place">1st Place / Gold Medal</option>
                <option value="Runner Up">Runner Up / Silver Medal</option>
                <option value="Consolation">Consolation Prize / Top 5</option>
                <option value="Lead Organizer">Lead Student Organizer</option>
                <option value="Participation">Participation Delegate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Impact Points (Non-negative)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={formData.impact_points || 0}
                onChange={(e) => setFormData({ ...formData, impact_points: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organizer / Host Body *
              </label>
              <input
                type="text"
                required
                value={formData.organizer || ''}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="e.g. AICTE & Ministry of Education"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.event_date || ''}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Certificate / Trophy Ref
            </label>
            <input
              type="text"
              value={formData.certificate_ref || ''}
              onChange={(e) => setFormData({ ...formData, certificate_ref: e.target.value })}
              placeholder="e.g. SIH-2023-WINNER-TEAM12"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
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
              {activity ? 'Update Activity' : 'Record Activity'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
