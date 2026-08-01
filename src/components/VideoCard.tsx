import React, { useState } from 'react';
import { 
  Play, Download, Eye, ThumbsUp, Share2, Calendar, 
  Check, CheckSquare, Square, Film, Clock, HardDrive, Info, Sparkles 
} from 'lucide-react';
import { FacebookVideo, VideoQuality } from '../types';

interface VideoCardProps {
  video: FacebookVideo;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onQualityChange: (id: string, newQuality: VideoQuality) => void;
  onSingleDownload: (video: FacebookVideo) => void;
  onOpenPreview: (video: FacebookVideo) => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  lowBandwidthMode?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isSelected,
  onToggleSelect,
  onQualityChange,
  onSingleDownload,
  onOpenPreview,
  isDownloading,
  downloadProgress,
  lowBandwidthMode
}) => {
  const [imgError, setImgError] = useState(false);

  // Find current quality stream object or best available
  const activeStream = video.qualityStreams.find(s => s.quality === video.selectedQuality) 
    || video.qualityStreams[0];

  const displayThumb = !imgError && video.thumbnailUrl ? video.thumbnailUrl : video.authorAvatar;

  return (
    <div 
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden bg-slate-900 flex flex-col justify-between ${
        isSelected 
          ? 'border-blue-500 shadow-xl shadow-blue-500/10 bg-slate-900/90 ring-1 ring-blue-500/50' 
          : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      <div>
        
        {/* Top Thumbnail Section */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onOpenPreview(video)}>
          
          {!lowBandwidthMode && displayThumb ? (
            <img
              src={displayThumb}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => {
                if (!imgError) setImgError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 text-slate-300 text-center relative">
              <Film className="w-10 h-10 text-blue-500 mb-2 opacity-80" />
              <span className="text-xs font-bold text-white line-clamp-1 max-w-[85%]">{video.title}</span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">{video.authorName}</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40" />

          {/* Top Left Selection Checkbox */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(video.id);
            }}
            className="absolute top-2.5 left-2.5 z-20 cursor-pointer"
          >
            <div className={`p-1 rounded-lg backdrop-blur-md transition-all ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-950/70 text-slate-300 hover:bg-slate-900'
            }`}>
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-white" />
              ) : (
                <Square className="w-5 h-5 text-slate-300" />
              )}
            </div>
          </div>

          {/* Top Right Badges (Platform / Reel / Quality) */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            {video.platform && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/90 text-slate-200 border border-slate-700 capitalize shadow">
                {video.platform}
              </span>
            )}
            {video.isReel && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 text-white uppercase tracking-wider shadow">
                Reel
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600/90 backdrop-blur-md text-white shadow">
              {activeStream?.quality || 'HD'}
            </span>
          </div>

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-950/30">
            <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Duration & Size Badges */}
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-2 text-[11px] font-medium text-white">
            <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {video.durationFormatted}
            </span>
            {activeStream?.fileSizeEstimateMB && (
              <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center gap-1 text-emerald-400 font-semibold">
                <HardDrive className="w-3 h-3" />
                ~{activeStream.fileSizeEstimateMB} MB
              </span>
            )}
          </div>

        </div>

        {/* Video Information Body */}
        <div className="p-4 space-y-3">
          
          <div className="space-y-1">
            <h4 
              onClick={() => onOpenPreview(video)}
              className="text-sm font-semibold text-white line-clamp-2 hover:text-blue-400 cursor-pointer leading-snug transition-colors"
              title={video.title}
            >
              {video.title}
            </h4>

            {/* Upload Date & Stats */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {video.uploadDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                {video.viewsCount.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Resolution Selector Control */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Select Resolution:</span>
              <span className="text-blue-400 text-[10px] font-mono">{activeStream?.resolution || '1080p'}</span>
            </label>

            <select
              value={video.selectedQuality}
              onChange={(e) => onQualityChange(video.id, e.target.value as VideoQuality)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="Best">Best Available (Auto)</option>
              {video.qualityStreams.map((s) => (
                <option key={s.quality} value={s.quality}>
                  {s.label} ({s.fileSizeEstimateMB ? `~${s.fileSizeEstimateMB}MB` : s.quality})
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Card Action Buttons */}
      <div className="p-4 pt-0 gap-2 flex items-center justify-between">
        <button
          onClick={() => onOpenPreview(video)}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Preview video and metadata"
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Details</span>
        </button>

        <button
          onClick={() => onSingleDownload(video)}
          disabled={isDownloading}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isDownloading
              ? 'bg-blue-600/30 text-blue-300 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer'
          }`}
        >
          <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span>{isDownloading ? `${downloadProgress || 0}%` : 'Download'}</span>
        </button>
      </div>

    </div>
  );
};
