import React from 'react';
import { MediaItem, VideoQuality } from '../types';
import { Play, Download, Check, Eye, Heart, Calendar, HardDrive, Sparkles, Loader2 } from 'lucide-react';

interface MediaCardProps {
  media: MediaItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onQualityChange: (id: string, newQuality: VideoQuality) => void;
  onSingleDownload: (media: MediaItem) => void;
  onOpenPreview: (media: MediaItem) => void;
  downloadProgress?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  isSelected,
  onToggleSelect,
  onQualityChange,
  onSingleDownload,
  onOpenPreview,
  downloadProgress
}) => {
  const currentStream = media.qualityStreams.find(s => s.quality === media.selectedQuality) || media.qualityStreams[0];

  return (
    <div className={`group relative bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      isSelected 
        ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-slate-900/90' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        <img
          src={media.thumbnailUrl}
          alt={media.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

        {/* Selection Checkbox */}
        <button
          onClick={() => onToggleSelect(media.id)}
          className={`absolute top-3 left-3 w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-950/60 border-slate-700 text-transparent hover:border-slate-500'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Platform Badge */}
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800">
          {media.platform}
        </span>

        {/* Duration / Resolution Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-slate-300">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 font-mono">
            {media.durationFormatted}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold">
            {currentStream?.resolution || '1080p'}
          </span>
        </div>

        {/* Play Overlay Button */}
        <button
          onClick={() => onOpenPreview(media)}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100"
        >
          <Play className="w-5 h-5 ml-0.5 fill-white" />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        
        {/* Title */}
        <h3 
          onClick={() => onOpenPreview(media)}
          className="text-sm font-bold text-white line-clamp-2 hover:text-blue-400 transition cursor-pointer leading-snug"
        >
          {media.title}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              {media.viewsCount ? media.viewsCount.toLocaleString() : '12.4k'}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-slate-500" />
              {media.likesCount ? media.likesCount.toLocaleString() : '850'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            {media.uploadDate}
          </span>
        </div>

        {/* Quality Selector & Size Estimate */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          
          <select
            value={media.selectedQuality}
            onChange={(e) => onQualityChange(media.id, e.target.value as VideoQuality)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition"
          >
            {media.qualityStreams.map((qs) => (
              <option key={qs.quality} value={qs.quality}>
                {qs.quality} ({qs.container || 'mp4'})
              </option>
            ))}
          </select>

          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-500" />
            ~{currentStream?.fileSizeEstimateMB || 20}MB
          </span>

        </div>

        {/* Download Trigger Button */}
        <button
          onClick={() => onSingleDownload(media)}
          disabled={downloadProgress !== undefined && downloadProgress > 0 && downloadProgress < 100}
          className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700/80 hover:border-blue-500"
        >
          {downloadProgress !== undefined && downloadProgress > 0 && downloadProgress < 100 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Downloading ({downloadProgress}%)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download {media.selectedQuality}</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
};
