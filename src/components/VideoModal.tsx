import React, { useState } from 'react';
import { 
  X, Play, Download, ExternalLink, Calendar, Eye, ThumbsUp, 
  Share2, HardDrive, Check, Copy, Shield, Film, Sparkles 
} from 'lucide-react';
import { FacebookVideo, VideoQuality } from '../types';

interface VideoModalProps {
  video: FacebookVideo | null;
  onClose: () => void;
  onDownload: (video: FacebookVideo, quality: VideoQuality) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  onClose,
  onDownload
}) => {
  if (!video) return null;

  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>(video.selectedQuality || 'Best');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeStream = video.qualityStreams.find(s => s.quality === selectedQuality) || video.qualityStreams[0];

  const handleCopyStreamUrl = () => {
    if (activeStream?.url) {
      navigator.clipboard.writeText(activeStream.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white truncate max-w-md">
              {video.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* HTML5 Video Player */}
          <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border border-slate-800 shadow-xl">
            <video
              key={activeStream?.url}
              src={activeStream?.url}
              controls
              autoPlay={false}
              poster={(video.thumbnailUrl && video.thumbnailUrl.trim() !== '') ? video.thumbnailUrl : undefined}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Quality Stream Options */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Choose Available Quality Stream:
              </span>
              <span className="text-xs text-blue-400 font-mono">{activeStream?.resolution}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {video.qualityStreams.map((stream) => (
                <button
                  key={stream.quality}
                  onClick={() => setSelectedQuality(stream.quality)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedQuality === stream.quality
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{stream.quality}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">~{stream.fileSizeEstimateMB}MB</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {stream.resolution} • {stream.bitrate}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Video Metadata Breakdown */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-200 text-sm">Extracted Post Metadata</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Author</span>
                <span className="font-semibold text-white">{video.authorName}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Upload Date</span>
                <span className="font-semibold text-white">{video.uploadDate}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Views</span>
                <span className="font-semibold text-white">{video.viewsCount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Duration</span>
                <span className="font-semibold text-white">{video.durationFormatted}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-500 text-[10px] block">Description</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {video.description}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          
          <button
            onClick={handleCopyStreamUrl}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Stream Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Stream URL</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <a
              href={video.originalPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Facebook Post</span>
            </a>

            <button
              onClick={() => {
                onDownload(video, selectedQuality);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Save {selectedQuality} Video to Local Drive</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
