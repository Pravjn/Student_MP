import React, { useState } from 'react';
import { db } from '../db/relationalStore';
import { SyncLogEntry } from '../types/schema';
import { syncDatabaseToGoogleSheets } from '../services/googleSheetsService';
import { exportDatabaseToExcel, importDatabaseFromExcel } from '../services/excelService';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { User } from 'firebase/auth';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database
} from 'lucide-react';

interface SyncManagerModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  onOpenConnectSheet?: () => void;
}

export const SyncManagerModal: React.FC<SyncManagerModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onAuthSuccess,
  onOpenConnectSheet,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const sheetsConfig = db.getSheetsConfig();
  const logs = db.getLogs();

  if (!isOpen) return null;

  const handleSyncToGoogleSheets = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      // 1. Direct Apps Script Web App (zero-login)
      if (sheetsConfig.webAppUrl) {
        const { syncDatabaseViaAppsScript } = await import('../services/appsScriptTemplate');
        const syncRes = await syncDatabaseViaAppsScript(sheetsConfig.webAppUrl);
        setFeedback(syncRes.message || 'Successfully synchronized all 6 sheets via Apps Script!');
        setIsError(false);
        return;
      }

      // 2. OAuth route if user is signed in
      if (currentUser) {
        let token = await getAccessToken();
        if (!token) {
          const res = await googleSignIn();
          if (res) {
            token = res.accessToken;
            onAuthSuccess(res.user, token);
          }
        }
        if (token) {
          const syncRes = await syncDatabaseToGoogleSheets(token, sheetsConfig.spreadsheetId || undefined);
          setFeedback(
            `Successfully synchronized to Google Sheet! (${syncRes.recordsSynced.students} students, ${syncRes.recordsSynced.courses} courses, ${syncRes.recordsSynced.seminars} seminars, ${syncRes.recordsSynced.activities} activities)`
          );
          setIsError(false);
          return;
        }
      }

      // 3. Fallback: prompt to connect
      if (onOpenConnectSheet) {
        onClose();
        onOpenConnectSheet();
        return;
      }
      throw new Error('Please configure Google Apps Script Web App or Sheet URL first.');
    } catch (err: any) {
      setFeedback(err.message || 'Google Sheets sync failed');
      setIsError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportExcel = () => {
    exportDatabaseToExcel();
    setFeedback('Excel workbook generated and downloaded with 7 structured worksheets!');
    setIsError(false);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importDatabaseFromExcel(file);
      if (res.success) {
        setFeedback(`Imported ${res.importedCounts.students} students successfully!`);
        setIsError(false);
      } else {
        setFeedback(`Import completed with warnings: ${res.errors.join('; ')}`);
        setIsError(true);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Excel import failed');
      setIsError(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 id="sync-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Spreadsheet Synchronisation & Data Parity Layer
              </h2>
              <p className="text-xs text-slate-500">
                Continuous 1-Way and 2-Way Sync with Google Sheets & Local Excel (.xlsx) Storage
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                isError
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{feedback}</span>
            </div>
          )}

          {/* Google Sheets Connection Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Google Drive & Google Sheets Synchronisation
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser ? `Connected as ${currentUser.email}` : 'Not connected (Requires Google Sign-in)'}
                  </p>
                </div>
              </div>

              {currentUser && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Online
                </span>
              )}
            </div>

            {sheetsConfig.spreadsheetUrl ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Connected Spreadsheet:</span>
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open Live in Google Sheets
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  ID: {sheetsConfig.spreadsheetId}
                </div>
                {sheetsConfig.lastSyncedAt && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Last Synced: {new Date(sheetsConfig.lastSyncedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Clicking "Sync to Google Sheets" will create a designated 6-sheet workbook in your Google Drive and populate all profiles, grades, and portfolios.
              </div>
            )}

            <button
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing Tables...' : 'Sync Database to Google Sheets'}
            </button>
          </div>

          {/* Local Excel (.xlsx) Parity Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Excel (.xlsx) Multi-Sheet Storage
                </h3>
                <p className="text-xs text-slate-500">
                  Exports and imports workbook matching 3NF schema tables and Data Dictionary.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Download Excel Workbook
              </button>

              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                Import from Excel (.xlsx)
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Sync Audit Trail */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Recent Sync & Mutation Audit Log
            </h4>
            <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-[11px]">
              {logs.slice(0, 15).map((log) => (
                <div
                  key={log.log_id}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      [{log.action}]
                    </span>
                    <span className="truncate">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
