import React from 'react';
import { DebugInfo } from '../types';
import { Terminal, X, Copy, Check, Clock, Globe, Cpu } from 'lucide-react';

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugInfo,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !debugInfo) return null;

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Developer Debug Logs</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-medium">Platform</p>
            <p className="font-bold text-purple-400 uppercase">{debugInfo.detectedPlatform}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-medium">URL Type</p>
            <p className="font-bold text-blue-400 uppercase">{debugInfo.detectedUrlType}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-medium">Engine</p>
            <p className="font-bold text-emerald-400 truncate">{debugInfo.selectedExtractionEngine}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-medium">Execution Time</p>
            <p className="font-bold text-amber-400">{debugInfo.processingTimeMs} ms</p>
          </div>
        </div>

        {/* Raw Log Viewer */}
        <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-3 leading-relaxed">
          
          <div>
            <span className="text-purple-400 font-bold">// Original URL:</span>
            <p className="text-slate-400 break-all">{debugInfo.originalUrl}</p>
          </div>

          <div>
            <span className="text-purple-400 font-bold">// Cleaned URL (Tracking stripped):</span>
            <p className="text-slate-400 break-all">{debugInfo.cleanedUrl}</p>
          </div>

          <div>
            <span className="text-purple-400 font-bold">// Resolved Final Target:</span>
            <p className="text-slate-400 break-all">{debugInfo.resolvedUrl}</p>
          </div>

          {debugInfo.ytDlpCommand && (
            <div>
              <span className="text-purple-400 font-bold">// yt-dlp CLI Command:</span>
              <p className="text-emerald-300 break-all bg-slate-900 p-2 rounded-lg mt-1">{debugInfo.ytDlpCommand}</p>
            </div>
          )}

          {debugInfo.ytDlpStdoutSnippet && (
            <div>
              <span className="text-purple-400 font-bold">// Output Snippet:</span>
              <pre className="text-slate-400 bg-slate-900 p-2 rounded-lg mt-1 overflow-x-auto">
                {debugInfo.ytDlpStdoutSnippet}
              </pre>
            </div>
          )}

          {debugInfo.extractionError && (
            <div>
              <span className="text-red-400 font-bold">// Engine Error Note:</span>
              <p className="text-red-300 bg-red-950/40 p-2 rounded-lg mt-1">{debugInfo.extractionError}</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
