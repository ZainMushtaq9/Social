import React, { useState } from 'react';
import { 
  Download, Pause, Play, X, CheckCircle2, AlertCircle, 
  RefreshCw, Archive, FileText, Sliders, HardDrive, Zap, ShieldCheck, Info 
} from 'lucide-react';
import { DownloadTask, GlobalDownloadSettings } from '../types';
import { DownloadDetailsModal, getPlatformBadge } from './DownloadDetailsModal';

interface DownloadManagerProps {
  tasks: DownloadTask[];
  settings: GlobalDownloadSettings;
  onUpdateSettings: (newSettings: Partial<GlobalDownloadSettings>) => void;
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onRetryTask: (id: string) => void;
  onCancelAll: () => void;
  onClearCompleted: () => void;
  onDownloadZip: () => void;
  isZipping?: boolean;
  onOpenPreview?: (video: any) => void;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  tasks,
  settings,
  onUpdateSettings,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onRetryTask,
  onCancelAll,
  onClearCompleted,
  onDownloadZip,
  isZipping,
  onOpenPreview
}) => {
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<DownloadTask | null>(null);

  if (tasks.length === 0) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status === 'downloading' || t.status === 'fetching_metadata' || t.status === 'processing_metadata');
  const pausedTasks = tasks.filter(t => t.status === 'paused');
  const queuedTasks = tasks.filter(t => t.status === 'queued');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  const totalProgressPercent = Math.round(
    tasks.reduce((acc, t) => acc + t.progressPercent, 0) / tasks.length
  );

  const totalDownloadedBytes = tasks.reduce((acc, t) => acc + t.downloadedBytes, 0);
  const totalDownloadedMB = (totalDownloadedBytes / (1024 * 1024)).toFixed(1);

  // Calculate overall download speed in MB/s
  const currentSpeedBps = activeTasks.reduce((acc, t) => acc + t.speedBps, 0);
  const currentSpeedMBs = (currentSpeedBps / (1024 * 1024)).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl space-y-4">
      
      {/* Header & Global Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Download Control Center & Details ({completedTasks.length}/{tasks.length} Saved)
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Speed: <strong className="text-emerald-400">{currentSpeedMBs} MB/s</strong></span>
                <span>•</span>
                <span>Downloaded: <strong className="text-blue-400">{totalDownloadedMB} MB</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-emerald-400 font-medium">Local Drive</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {completedTasks.length > 0 && (
            <button
              onClick={onDownloadZip}
              disabled={isZipping}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
            >
              <Archive className={`w-3.5 h-3.5 ${isZipping ? 'animate-spin' : ''}`} />
              <span>{isZipping ? 'Packaging ZIP...' : `Export All as ZIP (${completedTasks.length})`}</span>
            </button>
          )}

          {activeTasks.length > 0 && (
            <button
              onClick={onCancelAll}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop All</span>
            </button>
          )}

          <button
            onClick={onClearCompleted}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Clear Finished
          </button>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> Overall Batch Download Progress
          </span>
          <span className="text-emerald-400 font-mono font-bold text-sm">{totalProgressPercent}%</span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-md"
            style={{ width: `${totalProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Settings Bar inline */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-slate-300 font-medium">Parallel Limit:</span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => onUpdateSettings({ concurrencyLimit: num })}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                  settings.concurrencyLimit === num
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {num}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Saves directly to Local Device Downloads folder</span>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const platformInfo = getPlatformBadge(task.platform || task.video.platform);

          return (
            <div
              key={task.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div 
                  className="relative w-12 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800 cursor-pointer"
                  onClick={() => setSelectedTaskForDetails(task)}
                >
                  <img
                    src={task.video.thumbnailUrl || task.video.authorAvatar}
                    alt={task.video.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 px-1 bg-slate-950/90 text-[9px] font-bold text-blue-400">
                    {task.chosenQuality}
                  </span>
                </div>

                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${platformInfo.color}`}>
                      {platformInfo.name}
                    </span>
                    <h5 
                      className="font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
                      title={task.video.title}
                      onClick={() => setSelectedTaskForDetails(task)}
                    >
                      {task.video.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-blue-400 font-mono">{task.chosenStream?.resolution || '1080p'}</span>
                    <span>•</span>
                    <span>
                      {(task.downloadedBytes / (1024 * 1024)).toFixed(1)} MB / ~{(task.chosenStream?.fileSizeEstimateMB || 20).toFixed(1)} MB
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono">
                      {task.status === 'downloading' ? `${((task.speedBps || 0) / (1024 * 1024)).toFixed(1)} MB/s` : task.status}
                    </span>
                  </div>

                  {/* Progress bar line */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-200 ${
                        task.status === 'completed'
                          ? 'bg-emerald-500'
                          : task.status === 'paused'
                          ? 'bg-amber-500'
                          : task.status === 'failed'
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Status Badge & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                
                {/* Status Indicator & Pause/Resume Controls */}
                <div className="flex items-center gap-1.5">
                  {task.status === 'completed' && (
                    <>
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                      {task.blobUrl && (
                        <a
                          href={task.blobUrl}
                          download={task.savedFileName || `${task.video.title}.mp4`}
                          className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all"
                          title="Save MP4 directly to Local Drive"
                        >
                          <Download className="w-3 h-3" /> Save MP4
                        </a>
                      )}
                    </>
                  )}

                  {task.status === 'downloading' && (
                    <>
                      <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold animate-pulse">
                        {task.progressPercent}%
                      </span>
                      <button
                        onClick={() => onPauseTask(task.id)}
                        className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Pause downloading stream"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    </>
                  )}

                  {task.status === 'paused' && (
                    <>
                      <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                        Paused ({task.progressPercent}%)
                      </span>
                      <button
                        onClick={() => onResumeTask(task.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all"
                        title="Resume downloading stream"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    </>
                  )}

                  {task.status === 'queued' && (
                    <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                      Queued
                    </span>
                  )}

                  {task.status === 'failed' && (
                    <>
                      <span className="px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                      <button
                        onClick={() => onRetryTask(task.id)}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all"
                        title="Retry download"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </>
                  )}
                </div>

                {/* Inspect Details Button */}
                <button
                  onClick={() => setSelectedTaskForDetails(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="View Download Details & Stream Inspector"
                >
                  <Info className="w-4 h-4 text-blue-400" />
                </button>

                {/* Cancel Action */}
                <button
                  onClick={() => onCancelTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove task"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {selectedTaskForDetails && (
        <DownloadDetailsModal
          task={selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
          onPauseTask={onPauseTask}
          onResumeTask={onResumeTask}
          onCancelTask={onCancelTask}
          onRetryTask={onRetryTask}
          onOpenPreview={onOpenPreview}
        />
      )}

    </div>
  );
};

