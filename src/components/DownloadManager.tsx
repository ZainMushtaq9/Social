import React from 'react';
import { DownloadTask, GlobalSettings } from '../types';
import { 
  Download, Pause, Play, RotateCcw, X, CheckCircle2, 
  AlertCircle, Archive, Trash2, ArrowDownToLine, Loader2, Sparkles, FileText
} from 'lucide-react';

interface DownloadManagerProps {
  tasks: DownloadTask[];
  settings: GlobalSettings;
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onRetryTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onCancelAll: () => void;
  onClearCompleted: () => void;
  onDownloadZip: () => void;
  isZipping: boolean;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  tasks,
  settings,
  onPauseTask,
  onResumeTask,
  onRetryTask,
  onCancelTask,
  onCancelAll,
  onClearCompleted,
  onDownloadZip,
  isZipping
}) => {
  if (tasks.length === 0) return null;

  const activeCount = tasks.filter(t => t.status === 'downloading' || t.status === 'queued').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
      
      {/* Drawer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Active Downloads</h3>
            <p className="text-xs text-slate-400">
              {activeCount} downloading/queued &bull; {completedCount} completed &bull; {failedCount} failed
            </p>
          </div>
        </div>

        {/* Global Task Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {completedCount > 0 && (
            <button
              onClick={onDownloadZip}
              disabled={isZipping}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Zipping Archive...</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Export All ZIP</span>
                </>
              )}
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear Done</span>
            </button>
          )}

          {activeCount > 0 && (
            <button
              onClick={onCancelAll}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/20 transition"
            >
              Cancel All
            </button>
          )}
        </div>

      </div>

      {/* Task List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const speedMBps = (task.speedBps / (1024 * 1024)).toFixed(1);
          const downloadedMB = (task.downloadedBytes / (1024 * 1024)).toFixed(1);
          const totalMB = (task.totalBytes / (1024 * 1024)).toFixed(1);

          return (
            <div
              key={task.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={task.media.thumbnailUrl}
                    alt={task.media.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                  />
                  <div className="truncate">
                    <p className="font-bold text-white truncate">{task.media.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {task.chosenQuality} &bull; {task.platform.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Status Badges & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  
                  {task.status === 'downloading' && (
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {speedMBps} MB/s
                    </span>
                  )}

                  {task.status === 'completed' && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  )}

                  {task.status === 'failed' && (
                    <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}

                  {/* Single Task Controls */}
                  {task.status === 'downloading' && (
                    <button
                      onClick={() => onPauseTask(task.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Pause"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {task.status === 'paused' && (
                    <button
                      onClick={() => onResumeTask(task.id)}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                      title="Resume"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                  )}

                  {task.status === 'failed' && (
                    <button
                      onClick={() => onRetryTask(task.id)}
                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition"
                      title="Retry"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onCancelTask(task.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition"
                    title="Cancel/Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>

              {/* Progress Bar */}
              {(task.status === 'downloading' || task.status === 'paused' || task.status === 'queued') && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        task.status === 'paused'
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{downloadedMB} MB / {totalMB} MB</span>
                    <span>{task.progressPercent}%</span>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
