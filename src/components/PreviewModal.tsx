import React from 'react';
import { MediaItem, VideoQuality } from '../types';
import { X, Download, HardDrive, Film, ExternalLink } from 'lucide-react';

interface PreviewModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onDownload: (media: MediaItem, quality: VideoQuality) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  media,
  onClose,
  onDownload
}) => {
  if (!media) return null;

  const stream = media.qualityStreams.find(s => s.quality === media.selectedQuality) || media.qualityStreams[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h3 className="font-bold text-white text-base line-clamp-1">{media.title}</h3>
            <p className="text-xs text-slate-400">{media.authorName} &bull; {media.platform.toUpperCase()}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          <video
            src={stream?.url}
            poster={media.thumbnailUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>

        {/* Footer info & download */}
        <div className="p-4 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 text-xs">
          <div className="space-y-1 text-slate-400 text-center sm:text-left">
            <p className="font-semibold text-slate-200">{stream?.label} ({stream?.resolution})</p>
            <p className="line-clamp-1 max-w-md">{media.description || 'Public media content'}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={media.originalPostUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Source</span>
            </a>

            <button
              onClick={() => {
                onDownload(media, media.selectedQuality);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Download Video</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
