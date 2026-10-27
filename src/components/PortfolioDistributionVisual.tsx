import React from 'react';
import { StudentSeminar, StudentActivity } from '../types/schema';
import { Sparkles, Trophy, FileBadge, Award, Flame } from 'lucide-react';

interface PortfolioDistributionVisualProps {
  seminars: StudentSeminar[];
  activities: StudentActivity[];
}

export const PortfolioDistributionVisual: React.FC<PortfolioDistributionVisualProps> = ({
  seminars,
  activities,
}) => {
  const internalSeminars = seminars.filter((s) => s.seminar_type === 'INTERNAL').length;
  const externalSeminars = seminars.filter((s) => s.seminar_type === 'EXTERNAL').length;
  const totalSeminars = seminars.length;

  const coCurricular = activities.filter((a) => a.activity_class === 'TECHNICAL_CO_CURRICULAR');
  const extraCurricular = activities.filter((a) => a.activity_class === 'EXTRA_CURRICULAR');
  const totalActivities = activities.length;

  const totalImpactPoints = activities.reduce((acc, a) => acc + (a.impact_points || 0), 0);

  let tier = { title: 'Emerging Scholar', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950', target: 500 };
  if (totalImpactPoints >= 1000) {
    tier = { title: 'Platinum All-Rounder', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950', target: 1500 };
  } else if (totalImpactPoints >= 600) {
    tier = { title: 'Gold Achiever', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950', target: 1000 };
  } else if (totalImpactPoints >= 300) {
    tier = { title: 'Silver Contributor', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950', target: 600 };
  }

  const hackathons = activities.filter((a) => a.category === 'Hackathon').length;
  const coding = activities.filter((a) => a.category === 'Coding Competition').length;
  const papers = activities.filter((a) => a.category === 'Paper Presentation').length;
  const sports = activities.filter((a) => a.category === 'Sports & Athletics').length;
  const cultural = activities.filter((a) => a.category === 'Cultural & Arts').length;
  const outreach = activities.filter((a) => a.category === 'NSS & Social Outreach').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Segregated Portfolio Distribution & Impact Score
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Surfaces portfolio balance between departmental vs external seminars, and technical vs extracurricular contributions.
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 ${tier.bg}`}>
          <Flame className={`w-4 h-4 ${tier.color}`} />
          <span className={`text-xs font-bold ${tier.color}`}>
            {tier.title} • {totalImpactPoints} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileBadge className="w-4 h-4 text-blue-500" />
                Seminars Ratio
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {totalSeminars} Total
              </span>
            </div>

            <div className="mt-3 h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${totalSeminars > 0 ? (internalSeminars / totalSeminars) * 100 : 50}%` }}
                title={`Internal: ${internalSeminars}`}
              />
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${totalSeminars > 0 ? (externalSeminars / totalSeminars) * 100 : 50}%` }}
                title={`External: ${externalSeminars}`}
              />
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Internal (Dept/College)
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {internalSeminars} ({totalSeminars > 0 ? Math.round((internalSeminars / totalSeminars) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  External (Conferences/IEEE)
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {externalSeminars} ({totalSeminars > 0 ? Math.round((externalSeminars / totalSeminars) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-500 text-center">
            Satisfies 3NF segregated portfolio criteria
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-500" />
                Activities Classification
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {totalActivities} Events
              </span>
            </div>

            <div className="mt-3 h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalActivities > 0 ? (coCurricular.length / totalActivities) * 100 : 50}%` }}
                title={`Co-Curricular: ${coCurricular.length}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${totalActivities > 0 ? (extraCurricular.length / totalActivities) * 100 : 50}%` }}
                title={`Extra-Curricular: ${extraCurricular.length}`}
              />
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Technical & Co-Curricular
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {coCurricular.length} ({totalActivities > 0 ? Math.round((coCurricular.length / totalActivities) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Extra-Curricular (Sports/NSS)
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {extraCurricular.length} ({totalActivities > 0 ? Math.round((extraCurricular.length / totalActivities) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-500 text-center">
            {coCurricular.length} Tech Comps • {extraCurricular.length} Sports/Arts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                Category Badges Earned
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                +{totalImpactPoints} pts
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Hackathons</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{hackathons}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Coding Contests</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{coding}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">IEEE Papers</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{papers}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Sports Medals</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{sports}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Cultural Arts</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{cultural}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">NSS Outreach</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{outreach}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Next Achiever Tier</span>
              <span>{totalImpactPoints} / {tier.target} pts</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, (totalImpactPoints / tier.target) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
