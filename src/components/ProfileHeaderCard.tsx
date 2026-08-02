import React from 'react';
import { CheckCircle2, Video, Users, Download, CheckSquare, Square, RefreshCw, Eye, Tag, Sparkles } from 'lucide-react';
import { FacebookProfileInfo } from '../types';

interface ProfileHeaderCardProps {
  profile: FacebookProfileInfo;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartBatchDownload: () => void;
  isDownloading: boolean;
  lowBandwidthMode?: boolean;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onStartBatchDownload,
  isDownloading,
  lowBandwidthMode
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white relative">
      
      {/* Cover Banner */}
      <div className="h-32 sm:h-44 w-full relative bg-slate-950 overflow-hidden">
        {!lowBandwidthMode && profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt={`${profile.name} Cover`}
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      </div>

      {/* Main Info Body */}
      <div className="px-4 sm:px-6 pb-5 -mt-12 sm:-mt-16 relative z-10 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          {/* Avatar & Info */}
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-slate-900 object-cover shadow-2xl bg-slate-800"
                referrerPolicy="no-referrer"
              />
              {profile.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {profile.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {profile.category}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="text-blue-400 font-medium">{profile.handle}</span>
                {profile.followersCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {profile.followersCount >= 1000000 
                        ? `${(profile.followersCount / 1000000).toFixed(1)}M Followers` 
                        : `${profile.followersCount.toLocaleString()} Followers`}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  {totalCount} Video{totalCount !== 1 ? 's' : ''} Scraped
                </span>
              </div>
            </div>
          </div>

          {/* Batch Download Action Button */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={onStartBatchDownload}
              disabled={selectedCount === 0 || isDownloading}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                selectedCount > 0 && !isDownloading
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 cursor-pointer scale-102 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>
                {isDownloading
                  ? 'Batch Downloading...'
                  : selectedCount > 0
                  ? `Download ${selectedCount} Selected Video${selectedCount > 1 ? 's' : ''}`
                  : 'Select Videos to Download'}
              </span>
            </button>
          </div>

        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {profile.bio}
          </p>
        )}

        {/* Bulk Selection Controls Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
          
          <div className="flex items-center gap-2">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Deselect All ({totalCount})
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-blue-400" />
                  Select All ({totalCount})
                </>
              )}
            </button>

            <span className="text-slate-400 hidden xs:inline">
              <strong className="text-white">{selectedCount}</strong> of <strong className="text-white">{totalCount}</strong> selected
            </span>
          </div>

          <div className="text-slate-400 text-[11px] flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Highest available resolution (1080p Full HD) selected by default</span>
          </div>

        </div>

      </div>
    </div>
  );
};
