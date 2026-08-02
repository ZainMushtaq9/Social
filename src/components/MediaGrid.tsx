import React, { useState } from 'react';
import { MediaItem, VideoQuality } from '../types';
import { MediaCard } from './MediaCard';
import { Grid, List, SlidersHorizontal, Sparkles } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onQualityChange: (id: string, newQuality: VideoQuality) => void;
  onGlobalQualityChange: (quality: VideoQuality) => void;
  onSingleDownload: (media: MediaItem) => void;
  onOpenPreview: (media: MediaItem) => void;
  activeDownloads: Record<string, number>;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onQualityChange,
  onGlobalQualityChange,
  onSingleDownload,
  onOpenPreview,
  activeDownloads
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'duration' | 'views'>('default');

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'duration') return b.durationSeconds - a.durationSeconds;
    if (sortBy === 'views') return b.viewsCount - a.viewsCount;
    return 0;
  });

  return (
    <div className="space-y-4">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs">
        
        {/* Global Quality Changer */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-slate-400 font-medium">Set All Quality:</span>
          <select
            onChange={(e) => onGlobalQualityChange(e.target.value as VideoQuality)}
            className="bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="Best">Best Quality (2160p / 1080p)</option>
            <option value="2160p">2160p (4K UHD)</option>
            <option value="1440p">1440p (2K QHD)</option>
            <option value="1080p">1080p (Full HD)</option>
            <option value="720p">720p (HD)</option>
            <option value="480p">480p (SD)</option>
            <option value="MP3">Audio Only (MP3)</option>
          </select>
        </div>

        {/* View Mode & Sorting */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 font-medium rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="default">Sort: Default</option>
            <option value="duration">Sort: Longest Duration</option>
            <option value="views">Sort: Most Views</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Grid Display */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
          : 'space-y-3'
      }>
        {sortedItems.map((media) => (
          <MediaCard
            key={media.id}
            media={media}
            isSelected={selectedIds.has(media.id)}
            onToggleSelect={onToggleSelect}
            onQualityChange={onQualityChange}
            onSingleDownload={onSingleDownload}
            onOpenPreview={onOpenPreview}
            downloadProgress={activeDownloads[media.id]}
          />
        ))}
      </div>

    </div>
  );
};
