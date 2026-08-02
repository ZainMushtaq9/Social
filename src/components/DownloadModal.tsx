import React from 'react';
import { MediaItem, VideoQuality } from '../types';
import { X, Download, HardDrive, Film, Play, Sparkles } from 'lucide-react';

interface DownloadModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onSelectFormat: (media: MediaItem, quality: VideoQuality) => void;
  onOpenPreview: (media: MediaItem) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  media,
  onClose,
  onSelectFormat,
  onOpenPreview
}) => {
  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Select Quality & Format
            </span>
            <h2 className="text-lg font-bold text-white line-clamp-1">{media.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Header */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <img
            src={media.thumbnailUrl}
            alt={media.title}
            className="w-20 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
          />
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-white line-clamp-1">{media.authorName}</p>
            <p className="text-slate-400">{media.durationFormatted} &bull; {media.uploadDate}</p>
            <button
              onClick={() => {
                onClose();
                onOpenPreview(media);
              }}
              className="text-blue-400 hover:underline font-semibold flex items-center gap-1 text-[11px] pt-1"
            >
              <Play className="w-3 h-3 fill-blue-400" />
              <span>Preview Stream</span>
            </button>
          </div>
        </div>

        {/* Streams List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {media.qualityStreams.map((stream) => (
            <div
              key={stream.quality}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition group cursor-pointer"
              onClick={() => {
                onSelectFormat(media, stream.quality);
                onClose();
              }}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{stream.label}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {stream.container || 'mp4'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Res: {stream.resolution} &bull; Codec: {stream.codec || 'h264'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">
                  ~{stream.fileSizeEstimateMB} MB
                </span>
                <button className="p-2 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white transition">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
