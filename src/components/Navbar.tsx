import React from 'react';
import { Download, Wifi, WifiOff, Zap, Video, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { GlobalDownloadSettings } from '../types';

interface NavbarProps {
  settings: GlobalDownloadSettings;
  onUpdateSettings: (newSettings: Partial<GlobalDownloadSettings>) => void;
  activeDownloadsCount: number;
  totalSelectedCount: number;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  activeDownloadsCount,
  totalSelectedCount,
  onOpenSettingsModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-lg shadow-blue-500/20 text-white">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Video Downloader
            </h1>
          </div>
        </div>

        {/* Action Controls & Bandwidth Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Low Bandwidth Mode Toggle Button */}
          <button
            onClick={() => onUpdateSettings({ lowBandwidthMode: !settings.lowBandwidthMode })}
            title={settings.lowBandwidthMode ? 'Low Bandwidth Mode Active (Saving Mobile Data)' : 'High Quality Mode Active'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              settings.lowBandwidthMode
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {settings.lowBandwidthMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Low Bandwidth</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Fast Network</span>
              </>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Concurrency ({settings.concurrencyLimit}x)</span>
          </button>

          {/* Active Tasks Badge */}
          {activeDownloadsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold animate-pulse shadow-md shadow-indigo-600/30">
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span>{activeDownloadsCount} Downloading</span>
            </div>
          )}

          {/* Selected Counter Chip */}
          {totalSelectedCount > 0 && activeDownloadsCount === 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>{totalSelectedCount} Selected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
