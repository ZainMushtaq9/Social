import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, LayoutGrid, List, Film, ArrowUpDown, 
  CheckSquare, Filter, Layers, CheckCircle2 
} from 'lucide-react';
import { FacebookVideo, VideoQuality } from '../types';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: FacebookVideo[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onQualityChange: (id: string, newQuality: VideoQuality) => void;
  onGlobalQualityChange: (quality: VideoQuality) => void;
  onSingleDownload: (video: FacebookVideo) => void;
  onOpenPreview: (video: FacebookVideo) => void;
  activeDownloads: Record<string, number>; // id -> progress
  lowBandwidthMode?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  selectedIds,
  onToggleSelect,
  onQualityChange,
  onGlobalQualityChange,
  onSingleDownload,
  onOpenPreview,
  activeDownloads,
  lowBandwidthMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'reels' | 'videos'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'duration' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [globalQuality, setGlobalQuality] = useState<VideoQuality>('Best');

  // Filter and sort videos
  const processedVideos = useMemo(() => {
    let result = [...videos];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
      );
    }

    // Filter type (reels vs standard videos)
    if (filterType === 'reels') {
      result = result.filter(v => Boolean(v.isReel));
    } else if (filterType === 'videos') {
      result = result.filter(v => !v.isReel);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      if (sortBy === 'views') {
        return b.viewsCount - a.viewsCount;
      }
      if (sortBy === 'duration') {
        return b.durationSeconds - a.durationSeconds;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [videos, searchQuery, filterType, sortBy]);

  const handleGlobalQualityChange = (q: VideoQuality) => {
    setGlobalQuality(q);
    onGlobalQualityChange(q);
  };

  return (
    <div className="space-y-4">
      
      {/* Filtering, Search & Bulk Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl space-y-3">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter videos by title..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pills, Sort & Global Quality Controls */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end text-xs">
            
            {/* Type Filter Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({videos.length})
              </button>
              <button
                onClick={() => setFilterType('videos')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'videos' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('reels')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'reels' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reels
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Viewed</option>
                <option value="duration">Longest Duration</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            {/* Global Quality Override */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <span className="text-slate-400 text-[11px] font-medium hidden xs:inline">Batch Quality:</span>
              <select
                value={globalQuality}
                onChange={(e) => handleGlobalQualityChange(e.target.value as VideoQuality)}
                className="bg-transparent text-blue-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="Best">Best Available (Auto)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
                <option value="360p">360p Mobile</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg ${viewMode === 'compact' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                title="Compact View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Video Items Render */}
      {processedVideos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Film className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
          <h4 className="text-base font-bold text-white">No videos matched your filter</h4>
          <p className="text-xs max-w-sm mx-auto text-slate-500">
            Try clearing search keywords or switching filters to display extracted Facebook profile media.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div 
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          {processedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={selectedIds.has(video.id)}
              onToggleSelect={onToggleSelect}
              onQualityChange={onQualityChange}
              onSingleDownload={onSingleDownload}
              onOpenPreview={onOpenPreview}
              isDownloading={Boolean(activeDownloads[video.id])}
              downloadProgress={activeDownloads[video.id]}
              lowBandwidthMode={lowBandwidthMode}
            />
          ))}
        </div>
      )}

    </div>
  );
};
