import React from 'react';
import { AppErrorInfo } from '../types';
import { AlertCircle, Bug, Terminal, RefreshCw, HelpCircle } from 'lucide-react';

interface ErrorCardProps {
  errorInfo: AppErrorInfo | null;
  onDismiss: () => void;
  onOpenDebug: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  errorInfo,
  onDismiss,
  onOpenDebug
}) => {
  if (!errorInfo) return null;

  return (
    <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3 animate-fadeIn">
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300 text-sm">{errorInfo.title}</h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">{errorInfo.message}</p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-200 text-xs font-semibold px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-900 transition shrink-0"
        >
          Dismiss
        </button>
      </div>

      {/* Suggestions List */}
      {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
        <div className="pl-8 pt-1 space-y-1 text-xs text-amber-200/80">
          <p className="font-semibold text-amber-300 text-[11px]">Recommended Actions:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errorInfo.suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 pl-8 pt-2">
        {errorInfo.debugInfo && (
          <button
            onClick={onOpenDebug}
            className="text-purple-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Open Developer Debug Logs</span>
          </button>
        )}
      </div>

    </div>
  );
};
