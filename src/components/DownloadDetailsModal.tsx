import React from 'react';
import { 
  X, Download, Pause, Play, RefreshCw, CheckCircle2, AlertCircle, 
  HardDrive, Info, Film, ExternalLink, Calendar, Eye, ThumbsUp, 
  Layers, ShieldCheck, Sparkles, Clock
} from 'lucide-react';
import { DownloadTask, PlatformType } from '../types';

interface DownloadDetailsModalProps {
  task: DownloadTask | null;
  onClose: () => void;
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onRetryTask: (id: string) => void;
  onOpenPreview?: (video: any) => void;
}

export const getPlatformBadge = (platform?: PlatformType) => {
  switch (platform) {
    case 'youtube':
      return { name: 'YouTube', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
    case 'instagram':
      return { name: 'Instagram', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
    case 'tiktok':
      return { name: 'TikTok', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    case 'twitter':
      return { name: 'Twitter / X', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    case 'pinterest':
      return { name: 'Pinterest', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    case 'vimeo':
      return { name: 'Vimeo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    case 'facebook':
    default:
      return { name: 'Facebook', color: 'bg-blue-600/10 text-blue-400 border-blue-600/30' };
  }
};

export const DownloadDetailsModal: React.FC<DownloadDetailsModalProps> = ({
  task,
  onClose,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onRetryTask,
  onOpenPreview
}) => {
  if (!task) return null;

  const { video, chosenQuality, chosenStream, status, progressPercent, downloadedBytes, totalBytes, speedBps, errorMessage, savedFileName, blobUrl } = task;
  const platformInfo = getPlatformBadge(task.platform || video.platform);

  const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
  const totalMB = ((totalBytes || (chosenStream?.fileSizeEstimateMB ? chosenStream.fileSizeEstimateMB * 1024 * 1024 : 20971520)) / (1024 * 1024)).toFixed(2);
  const speedMBs = ((speedBps || 0) / (1024 * 1024)).toFixed(2);

  const remainingBytes = Math.max(0, totalBytes - downloadedBytes);
  const remainingSecs = speedBps > 0 ? Math.round(remainingBytes / speedBps) : 0;
  const etaFormatted = remainingSecs > 60 ? `${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s` : `${remainingSecs}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Download Task Details</h3>
              <p className="text-xs text-slate-400">Inspecting video stream, download progress & local drive storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Card Overview */}
        <div className="flex gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800 items-center">
          <div className="relative w-24 aspect-video rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800">
            <img
              src={video.thumbnailUrl || video.authorAvatar}
              alt={video.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono font-bold text-emerald-400">
              {chosenQuality}
            </span>
          </div>

          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${platformInfo.color}`}>
                {platformInfo.name}
              </span>
              <span className="text-xs text-slate-400 truncate font-mono">
                {video.authorName} ({video.authorHandle})
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white line-clamp-2" title={video.title}>
              {video.title}
            </h4>
          </div>
        </div>

        {/* Live Progress & Controls Section */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Status:</span>
              {status === 'completed' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Local Drive
                </span>
              )}
              {status === 'downloading' && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold animate-pulse">
                  Downloading Stream
                </span>
              )}
              {status === 'paused' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                  <Pause className="w-3.5 h-3.5" /> Download Paused
                </span>
              )}
              {status === 'queued' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                  In Queue
                </span>
              )}
              {status === 'failed' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
            </div>

            <span className="text-sm font-mono font-bold text-emerald-400">{progressPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === 'completed'
                  ? 'bg-emerald-500'
                  : status === 'paused'
                  ? 'bg-amber-500'
                  : status === 'failed'
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">Downloaded Size</div>
              <div className="font-mono font-bold text-blue-400">{downloadedMB} / {totalMB} MB</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">Download Speed</div>
              <div className="font-mono font-bold text-emerald-400">{status === 'downloading' ? `${speedMBs} MB/s` : '0.00 MB/s'}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400">Estimated Time (ETA)</div>
              <div className="font-mono font-bold text-purple-400">{status === 'downloading' ? etaFormatted : status === 'completed' ? 'Finished' : 'Paused'}</div>
            </div>
          </div>

          {/* Interactive Pause / Resume / Save / Retry Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
            {status === 'downloading' && (
              <button
                onClick={() => onPauseTask(task.id)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Pause className="w-4 h-4" /> Pause Download
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={() => onResumeTask(task.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Play className="w-4 h-4" /> Resume Download
              </button>
            )}

            {status === 'failed' && (
              <button
                onClick={() => onRetryTask(task.id)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry Download
              </button>
            )}

            {status === 'completed' && blobUrl && (
              <a
                href={blobUrl}
                download={savedFileName || `${video.title}.mp4`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Download className="w-4 h-4" /> Save MP4 to Local Drive
              </a>
            )}

            {onOpenPreview && (
              <button
                onClick={() => {
                  onOpenPreview(video);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Film className="w-4 h-4 text-purple-400" /> Preview Video
              </button>
            )}

            <button
              onClick={() => {
                onCancelTask(task.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
            >
              <X className="w-4 h-4" /> Cancel Task
            </button>
          </div>
        </div>

        {/* Technical Specification details */}
        <div className="space-y-2 text-xs">
          <h5 className="font-extrabold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-blue-400" /> Storage & Stream Details
          </h5>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-slate-300 font-mono">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500 font-sans">Save Target:</span>
              <span className="text-emerald-400 font-bold font-sans">Local Drive (Downloads Folder)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500 font-sans">Filename:</span>
              <span className="text-white truncate max-w-[280px]" title={savedFileName}>{savedFileName || `${video.title}.mp4`}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500 font-sans">Quality & Stream:</span>
              <span className="text-blue-400">{chosenStream?.label || chosenQuality} ({chosenStream?.resolution})</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-sans">Original Source:</span>
              <a
                href={video.originalPostUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>View Source Post</span> <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
