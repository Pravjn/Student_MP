import React, { useState } from 'react';
import { StudentSeminar, StudentActivity, AcademicGapRecord } from '../types/schema';
import {
  FileBadge,
  Sparkles,
  Trophy,
  Calendar,
  Building,
  Award,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  Filter
} from 'lucide-react';

interface PortfoliosViewProps {
  studentId: string;
  seminars: StudentSeminar[];
  activities: StudentActivity[];
  gaps: AcademicGapRecord[];
  onOpenAddSeminar: () => void;
  onOpenEditSeminar: (seminar: StudentSeminar) => void;
  onRequestDeleteSeminar: (seminar: StudentSeminar) => void;
  onOpenAddActivity: () => void;
  onOpenEditActivity: (activity: StudentActivity) => void;
  onRequestDeleteActivity: (activity: StudentActivity) => void;
  onOpenAddGap: () => void;
  onRequestDeleteGap: (gap: AcademicGapRecord) => void;
}

export const PortfoliosView: React.FC<PortfoliosViewProps> = ({
  studentId,
  seminars,
  activities,
  gaps,
  onOpenAddSeminar,
  onOpenEditSeminar,
  onRequestDeleteSeminar,
  onOpenAddActivity,
  onOpenEditActivity,
  onRequestDeleteActivity,
  onOpenAddGap,
  onRequestDeleteGap,
}) => {
  const [activeTab, setActiveTab] = useState<'seminars' | 'activities' | 'gaps'>('seminars');
  const [seminarFilter, setSeminarFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'TECHNICAL_CO_CURRICULAR' | 'EXTRA_CURRICULAR'>('ALL');

  const filteredSeminars = seminars.filter((s) => {
    if (seminarFilter === 'ALL') return true;
    return s.seminar_type === seminarFilter;
  });

  const filteredActivities = activities.filter((a) => {
    if (activityFilter === 'ALL') return true;
    return a.activity_class === activityFilter;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Segregated Portfolios & Achievements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Normalized 3NF separation: Internal/External Seminars, Co-Curricular/Extracurricular activities, and Gap Records.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('seminars')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'seminars'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Seminars ({seminars.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Activities ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'gaps'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Gap Years ({gaps.length})
          </button>
        </div>
      </div>

      {activeTab === 'seminars' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                onClick={() => setSeminarFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  seminarFilter === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                All ({seminars.length})
              </button>
              <button
                onClick={() => setSeminarFilter('INTERNAL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  seminarFilter === 'INTERNAL'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Internal Seminars ({seminars.filter((s) => s.seminar_type === 'INTERNAL').length})
              </button>
              <button
                onClick={() => setSeminarFilter('EXTERNAL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  seminarFilter === 'EXTERNAL'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                External Seminars ({seminars.filter((s) => s.seminar_type === 'EXTERNAL').length})
              </button>
            </div>

            <button
              onClick={onOpenAddSeminar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Seminar
            </button>
          </div>

          {filteredSeminars.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              No {seminarFilter !== 'ALL' ? seminarFilter.toLowerCase() : ''} seminars found. Click "Record Seminar" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSeminars.map((sem) => (
                <div
                  key={sem.seminar_id}
                  className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          sem.seminar_type === 'INTERNAL'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {sem.seminar_type} SEMINAR
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {sem.role}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                      {sem.title}
                    </h4>

                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sem.venue_or_organizer}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sem.date_conducted}</span>
                      </div>
                      {sem.certificate_ref && (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                          <Award className="w-3.5 h-3.5 shrink-0" />
                          <span>Cert: {sem.certificate_ref}</span>
                        </div>
                      )}
                    </div>

                    {sem.remarks && (
                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 italic">
                        "{sem.remarks}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenEditSeminar(sem)}
                      aria-label="Edit seminar"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRequestDeleteSeminar(sem)}
                      aria-label="Delete seminar"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                onClick={() => setActivityFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  activityFilter === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                onClick={() => setActivityFilter('TECHNICAL_CO_CURRICULAR')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  activityFilter === 'TECHNICAL_CO_CURRICULAR'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Technical & Co-Curricular ({activities.filter((a) => a.activity_class === 'TECHNICAL_CO_CURRICULAR').length})
              </button>
              <button
                onClick={() => setActivityFilter('EXTRA_CURRICULAR')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  activityFilter === 'EXTRA_CURRICULAR'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Extra-Curricular ({activities.filter((a) => a.activity_class === 'EXTRA_CURRICULAR').length})
              </button>
            </div>

            <button
              onClick={onOpenAddActivity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Activity
            </button>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              No activities found in this classification. Click "Record Activity" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredActivities.map((act) => (
                <div
                  key={act.activity_id}
                  className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          act.activity_class === 'TECHNICAL_CO_CURRICULAR'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {act.category}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        🏆 {act.achievement_or_award}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                      {act.event_name}
                    </h4>

                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Org: {act.organizer}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{act.event_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Impact Score: +{act.impact_points} pts</span>
                      </div>
                      {act.certificate_ref && (
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          Ref: {act.certificate_ref}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenEditActivity(act)}
                      aria-label="Edit activity"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRequestDeleteActivity(act)}
                      aria-label="Delete activity"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Audit log of academic interruptions, drop years, medical leaves, or semester repetitions.
            </p>
            <button
              onClick={onOpenAddGap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Gap Year
            </button>
          </div>

          {gaps.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              No academic drop or gap years recorded for this student. Continuous academic progression verified.
            </div>
          ) : (
            <div className="space-y-3">
              {gaps.map((gap) => (
                <div
                  key={gap.gap_id}
                  className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-amber-900 dark:text-amber-200">
                          {gap.gap_type} ({gap.academic_year_affected})
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                          {gap.duration_years} Year{gap.duration_years > 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {gap.clearance_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                        <strong>Reason:</strong> {gap.reason}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Authorized by: {gap.approved_by}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRequestDeleteGap(gap)}
                    aria-label="Delete gap record"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors self-end sm:self-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
