import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, LayoutGrid, List, Film, ArrowUpDown, 
  CheckSquare, Filter, Layers, CheckCircle2, Calendar, Sparkles, X, ChevronDown 
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

  // Date Range Filter States
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Quick Date Range Preset helper
  const handleDatePreset = (preset: 'all' | '7days' | '30days' | 'year') => {
    const now = new Date();
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (preset === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      setDateFrom(yearStart.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    }
  };

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

    // Date range filter
    if (dateFrom) {
      result = result.filter(v => !v.uploadDate || v.uploadDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(v => !v.uploadDate || v.uploadDate <= dateTo);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime();
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
  }, [videos, searchQuery, filterType, dateFrom, dateTo, sortBy]);

  const handleGlobalQualityChange = (q: VideoQuality) => {
    setGlobalQuality(q);
    onGlobalQualityChange(q);
  };

  const handleSelectAllFiltered = () => {
    processedVideos.forEach(v => {
      if (!selectedIds.has(v.id)) {
        onToggleSelect(v.id);
      }
    });
  };

  const isAllFilteredSelected = processedVideos.length > 0 && processedVideos.every(v => selectedIds.has(v.id));

  return (
    <div className="space-y-4">
      
      {/* Filtering, Search, Date Range & Bulk Actions Bar */}
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

          {/* Filter Pills, Date Picker Toggle & Controls */}
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

            {/* Date Range Filter Button */}
            <button
              onClick={() => setShowDatePicker(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                dateFrom || dateTo
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {!dateFrom && !dateTo ? 'Date Range: All Dates' : `${dateFrom || 'Start'} to ${dateTo || 'End'}`}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

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

        {/* Date Filter Collapsible Panel */}
        {showDatePicker && (
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-blue-400">
                <Calendar className="w-4 h-4" /> Filter Videos by Upload Date Range
              </span>
              <button 
                onClick={() => handleDatePreset('all')}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Reset to All Dates
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Presets */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleDatePreset('all')}
                  className={`px-2.5 py-1 rounded-lg border ${!dateFrom && !dateTo ? 'bg-blue-600 text-white border-blue-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                >
                  All Dates (Default)
                </button>
                <button
                  onClick={() => handleDatePreset('7days')}
                  className="px-2.5 py-1 rounded-lg border bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleDatePreset('30days')}
                  className="px-2.5 py-1 rounded-lg border bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleDatePreset('year')}
                  className="px-2.5 py-1 rounded-lg border bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                >
                  This Year
                </button>
              </div>

              {/* Date pickers */}
              <div className="flex items-center gap-2 ml-auto text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">From:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">To:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Selection Banner for Filtered Results */}
        <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200">
              Showing <strong className="text-blue-400 font-bold">{processedVideos.length}</strong> of {videos.length} videos
            </span>
            {(!dateFrom && !dateTo) && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                All Dates Included (Scrapes 500+)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-medium transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {isAllFilteredSelected ? 'All Filtered Selected' : `Select All ${processedVideos.length} Videos`}
            </button>
          </div>
        </div>

      </div>

      {/* Video Items Render */}
      {processedVideos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Film className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
          <h4 className="text-base font-bold text-white">No videos matched your filter</h4>
          <p className="text-xs max-w-sm mx-auto text-slate-500">
            Try clearing date bounds or search keywords to display all extracted profile media.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Reset All Filters & Dates
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}

    </div>
  );
};

