import React from 'react';
import { db } from '../db/relationalStore';
import { User } from 'firebase/auth';
import {
  GitBranch,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';

interface SyncPipelineDiagramProps {
  currentUser: User | null;
  onOpenSyncManager: () => void;
}

export const SyncPipelineDiagram: React.FC<SyncPipelineDiagramProps> = ({
  currentUser,
  onOpenSyncManager,
}) => {
  const sheetsConfig = db.getSheetsConfig();
  const logs = db.getLogs();
  const latestLog = logs[0];

  const totalStudents = db.getStudents().length;
  const totalCourses = db.getAllCourses().length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            Live Database & Spreadsheet Synchronization Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Architecture showing continuous data parity: GUI mutations &rarr; 3NF Constraint Validation &rarr; Google Sheets & Excel storage.
          </p>
        </div>

        <button
          onClick={onOpenSyncManager}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          Manage Sync Settings &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>STEP 01</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2">
              GUI Interaction & Mutations
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              CRUD updates on students, semester theory/lab marks, seminars, or gap years.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
            {totalStudents} Students • {totalCourses} Courses
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>STEP 02</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2">
              3NF Constraint Engine
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Enforces CHECK bounds (marks &le; 100, SGPA &le; 10), FOREIGN KEY ON DELETE CASCADE, and UNIQUE roll numbers.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Pre-commit Validation Active
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              <span>STORAGE A</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${sheetsConfig.webAppUrl || sheetsConfig.spreadsheetUrl || currentUser ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
                {sheetsConfig.webAppUrl || sheetsConfig.spreadsheetUrl || currentUser ? 'CONNECTED' : 'DIRECT SYNC READY'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-1.5">
              Google Sheets (6 Tabs)
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Dynamic multi-tab sync across Google Drive via Apps Script or OAuth with instant shareable link.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[10px]">
            {sheetsConfig.spreadsheetUrl ? (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
              >
                Open Google Sheet
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                onClick={onOpenSyncManager}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Connect Google Sheet &rarr;
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>STORAGE B</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2">
              Excel (.xlsx) Mirroring
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Offline file export & import matching 3NF tables + Data Dictionary schema.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-500 font-mono">
            Full 7-Sheet Workbook Ready
          </div>
        </div>
      </div>

      {latestLog && (
        <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Latest Pipeline Event:
            </span>
            <span className="truncate">{latestLog.details}</span>
          </div>
          <span className="text-slate-400 font-mono shrink-0 ml-2">
            {new Date(latestLog.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
