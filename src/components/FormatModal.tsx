import React from 'react';
import { 
  X, Download, Film, HardDrive, Info, ShieldCheck, Sparkles, Clock, Eye, Music, CheckCircle2
} from 'lucide-react';
import { FacebookVideo, QualityStream, VideoQuality } from '../types';
import { getPlatformBadge } from './DownloadDetailsModal';

interface FormatModalProps {
  video: FacebookVideo | null;
  onClose: () => void;
  onSelectFormat: (video: FacebookVideo, quality: VideoQuality) => void;
  onOpenPreview?: (video: FacebookVideo) => void;
}

export const FormatModal: React.FC<FormatModalProps> = ({
  video,
  onClose,
  onSelectFormat,
  onOpenPreview
}) => {
  if (!video) return null;

  const platformInfo = getPlatformBadge(video.platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select Download Quality</h3>
              <p className="text-xs text-slate-400">Choose your preferred video resolution or audio format</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Card Summary */}
        <div className="flex gap-3.5 bg-slate-950 p-3 rounded-xl border border-slate-800 items-center">
          <div 
            className="relative w-24 aspect-video rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800 cursor-pointer group"
            onClick={() => onOpenPreview && onOpenPreview(video)}
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                <Film className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono font-bold text-white">
              {video.durationFormatted}
            </span>
          </div>

          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${platformInfo.color}`}>
                {platformInfo.name}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {video.authorName}
              </span>
            </div>
            <h4 className="font-bold text-sm text-white line-clamp-1" title={video.title}>
              {video.title}
            </h4>
          </div>
        </div>

        {/* Formats List */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Available Video Resolutions & Formats:</span>
          </label>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {video.qualityStreams.map((stream: QualityStream, idx: number) => {
              const isAudio = stream.quality === 'Audio Only' || stream.quality === 'MP3';
              const is4k = stream.quality === '2160p';
              const isFHD = stream.quality === '1080p';
              const isHD = stream.quality === '720p' || isFHD || is4k;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center min-w-[50px] ${
                      isAudio ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      is4k ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                      isHD ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isAudio ? <Music className="w-4 h-4" /> : stream.quality}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {stream.label}
                        </span>
                        {is4k && (
                          <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold">
                            4K UHD
                          </span>
                        )}
                        {isFHD && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                            1080p FHD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5 font-mono">
                        <span>Res: {stream.resolution}</span>
                        <span>•</span>
                        <span>{stream.bitrate}</span>
                        {stream.fileSizeEstimateMB > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                              <HardDrive className="w-3 h-3 inline" /> ~{stream.fileSizeEstimateMB} MB
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectFormat(video, stream.quality);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct High-Speed Download
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
