import React, { useState } from 'react';
import { db } from '../db/relationalStore';
import { APPS_SCRIPT_CODE, syncDatabaseViaAppsScript } from '../services/appsScriptTemplate';
import {
  X,
  FileSpreadsheet,
  Code,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  HelpCircle,
  Link as LinkIcon
} from 'lucide-react';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: (msg: string) => void;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const currentConfig = db.getSheetsConfig();
  const [activeTab, setActiveTab] = useState<'appscript' | 'sheet_url' | 'code_view'>('appscript');

  const [webAppUrl, setWebAppUrl] = useState(currentConfig.webAppUrl || '');
  const [sheetUrl, setSheetUrl] = useState(currentConfig.spreadsheetUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleConnectAppsScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webAppUrl.trim()) {
      setFeedback({ message: 'Please enter your Google Apps Script Web App URL', isError: true });
      return;
    }

    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncDatabaseViaAppsScript(webAppUrl);
      setFeedback({ message: res.message, isError: false });
      if (onSyncSuccess) onSyncSuccess(res.message);
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to connect. Ensure deployment access is set to "Anyone".',
        isError: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setFeedback({ message: 'Please paste a valid Google Spreadsheet URL', isError: true });
      return;
    }

    // Extract ID if URL matches
    let sheetId = null;
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    db.setSheetsConfig({
      spreadsheetUrl: sheetUrl.trim(),
      spreadsheetId: sheetId,
      connectionMode: 'DIRECT_URL',
      lastSyncedAt: new Date().toISOString(),
    });

    setFeedback({
      message: 'Google Spreadsheet linked successfully! Direct link saved.',
      isError: false,
    });
    if (onSyncSuccess) onSyncSuccess('Google Spreadsheet linked successfully!');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 id="connect-sheet-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Connect Google Sheet (No Login Required)
              </h2>
              <p className="text-xs text-slate-500">
                Directly connect any Google Sheet via Google Apps Script Web App or Sheet URL
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('appscript')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appscript'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Apps Script Web App Sync
          </button>
          <button
            onClick={() => setActiveTab('sheet_url')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sheet_url'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Direct Sheet URL
          </button>
          <button
            onClick={() => setActiveTab('code_view')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'code_view'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Get Apps Script Code
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                feedback.isError
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {feedback.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: APPS SCRIPT WEB APP */}
          {activeTab === 'appscript' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Recommended Zero-Login Method:</span> Deploying the provided Apps Script allows ScholarPulse to write all 6 relational sheets directly into your spreadsheet without requiring any Google sign-in popups!
              </div>

              <form onSubmit={handleConnectAppsScript} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Google Apps Script Web App URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    URL must end in <code>/exec</code> from your Apps Script deployment.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('code_view')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    How to get this URL (View Apps Script Code)
                  </button>

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Connecting & Syncing...' : 'Connect & Sync Now'}
                  </button>
                </div>
              </form>

              {currentConfig.spreadsheetUrl && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Connected Sheet:</span>
                  <a
                    href={currentConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Open Live Spreadsheet
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT SHEET URL */}
          {activeTab === 'sheet_url' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Already have a Google Spreadsheet? Paste its URL below to link it directly to ScholarPulse.
              </p>

              <form onSubmit={handleSaveDirectUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Google Spreadsheet URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Save & Link Spreadsheet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CODE VIEW & INSTRUCTIONS */}
          {activeTab === 'code_view' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Google Apps Script Code (Code.gs)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Paste into Google Sheets &gt; Extensions &gt; Apps Script
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied Code!' : 'Copy Apps Script'}
                </button>
              </div>

              {/* 4-Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>1. Open Google Sheet:</strong> Create a sheet at <code>sheets.new</code> and go to <em>Extensions &gt; Apps Script</em>.
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>2. Paste Script:</strong> Replace all code in <code>Code.gs</code> with the code below and save (Ctrl+S).
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>3. Deploy as Web App:</strong> Click <em>Deploy &gt; New deployment &gt; Web app</em>. Set access to <strong>"Anyone"</strong>!
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong>4. Connect:</strong> Copy the URL (ends in <code>/exec</code>) and paste into the <em>Apps Script Web App Sync</em> tab above.
                </div>
              </div>

              <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-xl overflow-x-auto max-h-56 border border-slate-800 leading-relaxed">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
