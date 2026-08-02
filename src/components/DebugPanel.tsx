import React, { useState } from 'react';
import { 
  Terminal, X, Copy, Check, ExternalLink, ShieldCheck, 
  AlertTriangle, ArrowRight, Layers, FileCode2, RefreshCw, Cpu
} from 'lucide-react';
import { DebugInfo } from '../types';

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
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'command' | 'logs' | 'raw'>('pipeline');

  if (!isOpen || !debugInfo) return null;

  const handleCopyDebugData = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Developer Debug & Diagnostic Panel</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DEV MODE
                </span>
              </h3>
              <p className="text-xs text-slate-400">URL resolution chain, yt-dlp arguments, and extraction logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDebugData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy Debug JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Data'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-slate-950/80 border-b border-slate-800 text-xs font-medium gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'pipeline' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>URL Pipeline & Redirects</span>
          </button>

          <button
            onClick={() => setActiveTab('command')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'command' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>yt-dlp Command</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Terminal Output Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'raw' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Raw JSON Data</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: URL Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              
              {/* Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Detected Platform</span>
                  <div className="font-bold text-white text-sm capitalize flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {debugInfo.detectedPlatform}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Scraped Timestamp</span>
                  <div className="font-mono text-slate-300 text-xs">
                    {debugInfo.scrapedAt}
                  </div>
                </div>
              </div>

              {/* Redirect Chain Step-by-Step */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Redirect Resolution Chain ({debugInfo.redirectChain.length} Hop{debugInfo.redirectChain.length !== 1 ? 's' : ''})</span>
                </h4>

                <div className="space-y-2">
                  {debugInfo.redirectChain.map((urlStep, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] break-all">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={idx === 0 ? 'text-amber-300 font-semibold' : idx === debugInfo.redirectChain.length - 1 ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                          {urlStep}
                        </span>
                        {idx === 0 && <span className="ml-2 text-[10px] text-amber-400/80 font-sans">(Original Input)</span>}
                        {idx === debugInfo.redirectChain.length - 1 && <span className="ml-2 text-[10px] text-emerald-400/80 font-sans">(Resolved Canonical URL)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* URLs Comparison */}
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Original Input URL:</div>
                  <div className="text-amber-400 break-all">{debugInfo.originalUrl}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Resolved Canonical URL passed to yt-dlp:</div>
                  <div className="text-emerald-400 font-bold break-all">{debugInfo.resolvedUrl}</div>
                </div>
              </div>

              {debugInfo.extractionError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Extraction Error Detected:</span>
                  </div>
                  <p className="font-mono text-[11px] break-words">{debugInfo.extractionError}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: yt-dlp Command */}
          {activeTab === 'command' && (
            <div className="space-y-3 font-mono">
              <div className="text-slate-400 text-xs">Command line arguments passed to local compiled yt-dlp binary:</div>
              <div className="p-4 bg-black rounded-xl border border-slate-800 text-emerald-400 break-all leading-relaxed select-all">
                {debugInfo.ytDlpCommand || './yt-dlp_linux --dump-single-json --no-warnings --ignore-errors --playlist-end 300'}
              </div>
            </div>
          )}

          {/* TAB 3: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3 font-mono">
              <div>
                <span className="text-slate-400 text-xs font-sans">Raw stdout / stderr log snippet:</span>
              </div>
              <div className="p-4 bg-black rounded-xl border border-slate-800 text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all text-[11px]">
                {debugInfo.ytDlpStderrSnippet || debugInfo.ytDlpStdoutSnippet || debugInfo.extractionError || 'No error logs recorded for this execution.'}
              </div>
            </div>
          )}

          {/* TAB 4: Raw JSON Data */}
          {activeTab === 'raw' && (
            <div className="font-mono">
              <pre className="p-4 bg-black rounded-xl border border-slate-800 text-blue-300 max-h-80 overflow-y-auto text-[11px]">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Validating direct yt-dlp extraction output
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};
