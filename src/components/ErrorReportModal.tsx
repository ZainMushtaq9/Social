import React, { useState } from 'react';
import { 
  X, AlertTriangle, Bug, Copy, Check, Send, 
  HelpCircle, RefreshCw, FileText, ExternalLink, ShieldAlert 
} from 'lucide-react';
import { AppErrorInfo } from '../types';

interface ErrorReportModalProps {
  errorInfo: AppErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  errorInfo,
  onClose,
  onRetry
}) => {
  const [copied, setCopied] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!errorInfo) return null;

  const debugPayload = {
    errorType: errorInfo.type,
    title: errorInfo.title,
    message: errorInfo.message,
    details: errorInfo.details || 'N/A',
    targetUrl: errorInfo.targetUrl || 'N/A',
    videoId: errorInfo.videoId || 'N/A',
    statusCode: errorInfo.statusCode || 'N/A',
    timestamp: errorInfo.timestamp || new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser',
    userNotes: userNotes.trim() || 'No extra notes provided'
  };

  const handleCopyReport = async () => {
    try {
      const formattedText = `=== SOCIAL VIDEO DOWNLOADER DIAGNOSTIC REPORT ===
Timestamp: ${debugPayload.timestamp}
Error Type: ${debugPayload.errorType}
Title: ${debugPayload.title}
Message: ${debugPayload.message}
Target URL: ${debugPayload.targetUrl}
Video ID: ${debugPayload.videoId}
Status Code: ${debugPayload.statusCode}
Technical Details: ${debugPayload.details}
Browser: ${debugPayload.userAgent}
User Notes: ${debugPayload.userNotes}
=================================================`;

      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setUserNotes('');
    }, 4000);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'INVALID_URL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PRIVATE_RESTRICTED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DOWNLOAD_FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Diagnostic & Error Report</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeColor(errorInfo.type)}`}>
                  {errorInfo.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">Diagnostic details and troubleshooting suggestions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Main Error Box */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-rose-200 text-base">{errorInfo.title}</h4>
                <p className="text-rose-100/90 text-xs leading-relaxed">{errorInfo.message}</p>
              </div>
            </div>
            
            {errorInfo.targetUrl && (
              <div className="pt-2 border-t border-rose-500/20 text-xs text-slate-300 font-mono truncate flex items-center gap-1.5">
                <span className="text-slate-400">Target URL:</span>
                <span className="text-rose-300 underline truncate">{errorInfo.targetUrl}</span>
              </div>
            )}
          </div>

          {/* Actionable Suggestions */}
          {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h5 className="font-semibold text-white text-xs flex items-center gap-1.5 text-blue-400">
                <HelpCircle className="w-4 h-4" /> Recommended Troubleshooting Steps:
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {errorInfo.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Technical Details */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(prev => !prev)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{showTechnicalDetails ? 'Hide Raw Server Logs & Request Data' : 'View Raw Server Logs & Diagnostic Payload'}</span>
            </button>

            {showTechnicalDetails && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 overflow-x-auto">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-1">
                  Debug Payload (JSON Format)
                </div>
                <pre className="whitespace-pre-wrap break-all text-emerald-400/90">
                  {JSON.stringify(debugPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Optional User Feedback Form */}
          <form onSubmit={handleSubmitReport} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">
                Optional: Describe what happened for developer logs
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g., 'Tried downloading a Facebook Reel from profile link, got error on stream #3...'"
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Diagnostic Log
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-400" /> Copy Diagnostic Report
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={reportSubmitted}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
              >
                {reportSubmitted ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Report Logged!
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Debug Feedback
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>

          {onRetry && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Action
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
