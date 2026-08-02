import React from 'react';
import { CreatorProfileInfo } from '../types';
import { CheckCircle2, Users, Film, Clock, Download, CheckSquare, Square, Zap } from 'lucide-react';

interface ProfileHeaderCardProps {
  profile: CreatorProfileInfo;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartBatchDownload: () => void;
  isDownloading: boolean;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onStartBatchDownload,
  isDownloading
}) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 animate-fadeIn">
      
      {/* Profile Info Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md shrink-0"
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{profile.name}</h2>
              {profile.verified && (
                <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20 shrink-0" />
              )}
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {profile.platform}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {profile.handle} &bull; <span className="text-slate-300">{profile.category}</span>
            </p>

            {profile.bio && (
              <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Extraction Stats Badges */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{profile.followersCount.toLocaleString()}</span>
            <span className="text-slate-400">followers</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{totalCount}</span>
            <span className="text-slate-400">media found</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{profile.extractionTimeMs}ms</span>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-slate-800/80"></div>

      {/* Batch Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center gap-3">
          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All Items'}</span>
          </button>

          <span className="text-slate-400 font-medium">
            <strong className="text-white font-bold">{selectedCount}</strong> of {totalCount} selected
          </span>
        </div>

        <button
          onClick={onStartBatchDownload}
          disabled={selectedCount === 0 || isDownloading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Batch Download Selected ({selectedCount})</span>
        </button>

      </div>

    </div>
  );
};
