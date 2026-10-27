import React, { useState } from 'react';
import {
  Database,
  Search,
  FileSpreadsheet,
  RefreshCw,
  BookOpen,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/firebaseAuth';
import { exportDatabaseToExcel, importDatabaseFromExcel } from '../services/excelService';
import { syncDatabaseToGoogleSheets } from '../services/googleSheetsService';
import { db } from '../db/relationalStore';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  onOpenDocs: () => void;
  onOpenSyncManager: () => void;
  onOpenConnectSheet: () => void;
  onOpenAddStudent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currentUser,
  onAuthSuccess,
  onAuthLogout,
  onOpenDocs,
  onOpenSyncManager,
  onOpenConnectSheet,
  onOpenAddStudent,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sheetsConfig = db.getSheetsConfig();
  const isSheetConnected = Boolean(sheetsConfig.webAppUrl || sheetsConfig.spreadsheetUrl || currentUser);

  const showNotification = (message: string, isError = false) => {
    setSyncFeedback({ message, isError });
    setTimeout(() => setSyncFeedback(null), 3800);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        showNotification(`Connected via Google Account (${res.user.email})`);
      }
    } catch {
      // Gracefully fall back to the Connect Sheet modal without noisy error alerts
      onOpenConnectSheet();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onAuthLogout();
    showNotification('Disconnected from Google Account');
  };

  const handleQuickSyncToSheets = async () => {
    // 1. Direct Google Apps Script Web App sync (Zero-login preferred route)
    if (sheetsConfig.webAppUrl) {
      setIsSyncing(true);
      try {
        const { syncDatabaseViaAppsScript } = await import('../services/appsScriptTemplate');
        const res = await syncDatabaseViaAppsScript(sheetsConfig.webAppUrl);
        showNotification(res.message || 'All 6 sheets synced successfully to Google Sheets!');
      } catch (err: any) {
        showNotification(err.message || 'Apps Script sync failed. Check URL or deploy settings.', true);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // 2. Google OAuth REST API route if user is signed in
    if (currentUser) {
      setIsSyncing(true);
      try {
        const token = await import('../services/firebaseAuth').then((m) => m.getAccessToken());
        if (!token) {
          onOpenConnectSheet();
          return;
        }
        const res = await syncDatabaseToGoogleSheets(token, sheetsConfig.spreadsheetId || undefined);
        showNotification(`Synced ${res.recordsSynced.students} students & ${res.recordsSynced.courses} courses to Google Sheets!`);
      } catch (err: any) {
        showNotification(err.message || 'Sheets sync error. Try Apps Script connection.', true);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // 3. Neither configured: Open the zero-login Connect Sheet modal
    onOpenConnectSheet();
  };

  const handleExportExcel = () => {
    exportDatabaseToExcel();
    setShowExcelMenu(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importDatabaseFromExcel(file);
      if (result.success) {
        setSyncFeedback({
          message: `Imported ${result.importedCounts.students} students from Excel file!`,
          isError: false,
        });
      } else {
        setSyncFeedback({
          message: `Excel import warnings: ${result.errors.slice(0, 2).join('; ')}`,
          isError: true,
        });
      }
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback({ message: err.message || 'Import failed', isError: true });
      setTimeout(() => setSyncFeedback(null), 5000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowExcelMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Mini-Project Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  ScholarPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  DBMS 3NF
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Academic & Portfolio Progression System
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by student name, roll number, department..."
                aria-label="Search student records"
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* Google Sheets Sync & Direct Connection */}
            {isSheetConnected ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleQuickSyncToSheets}
                  disabled={isSyncing}
                  title="Sync database to connected Google Sheet"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Sheets'}</span>
                </button>

                {sheetsConfig.spreadsheetUrl && (
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live Google Spreadsheet in Google Drive"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Open Sheet</span>
                  </a>
                )}

                <button
                  onClick={onOpenConnectSheet}
                  title="Configure Google Sheet connection & get Apps Script code"
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/70 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden xl:inline">Connected</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenConnectSheet}
                title="Connect Google Sheet directly via Apps Script Web App or Sheet URL"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Connect Google Sheet</span>
              </button>
            )}

            {/* Excel Sync / Export / Import Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                title="Excel (.xlsx) parity storage & sync options"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Excel (.xlsx)</span>
              </button>

              {showExcelMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Spreadsheet Storage Parity
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    Download Full Excel Workbook
                  </button>
                  <label className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    Import & Sync from Excel
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setShowExcelMenu(false);
                      onOpenSyncManager();
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Manager Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* DBMS Mini-Project Docs / Technical Report */}
            <button
              onClick={onOpenDocs}
              title="DBMS Mini-Project Documentation & Report"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">DBMS Docs & DDL</span>
            </button>

            {/* Add Student Button */}
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Student</span>
            </button>

          </div>
        </div>

      </div>

      {/* Non-intrusive Floating Notification Toast */}
      {syncFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-xl shadow-xl border flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2 ${
            syncFeedback.isError
              ? 'bg-rose-900/90 text-rose-50 border-rose-700 backdrop-blur-md'
              : 'bg-slate-900/95 text-slate-100 border-slate-700 backdrop-blur-md'
          }`}
        >
          {syncFeedback.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium leading-relaxed flex-1">{syncFeedback.message}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
          >
            <span className="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      )}
    </header>
  );
};
