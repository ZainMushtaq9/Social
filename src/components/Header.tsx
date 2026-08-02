import React from 'react';
import { Download, Sparkles, Terminal, Settings, History, Info, Film, Sun, Moon } from 'lucide-react';
import { GlobalSettings } from '../types';

interface HeaderProps {
  activeTab: 'home' | 'downloads' | 'settings' | 'about';
  setActiveTab: (tab: 'home' | 'downloads' | 'settings' | 'about') => void;
  activeDownloadsCount: number;
  completedDownloadsCount: number;
  settings: GlobalSettings;
  onToggleTheme: () => void;
  onOpenDebug: () => void;
  hasDebugInfo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeDownloadsCount,
  completedDownloadsCount,
  settings,
  onToggleTheme,
  onOpenDebug,
  hasDebugInfo
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group selection:bg-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Universal Media
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Open-Source Downloader Engine
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
              activeTab === 'downloads'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Downloads</span>
            {(activeDownloadsCount > 0 || completedDownloadsCount > 0) && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeDownloadsCount > 0 
                  ? 'bg-amber-500 text-slate-950 animate-pulse' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {activeDownloadsCount > 0 ? activeDownloadsCount : completedDownloadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline">About</span>
          </button>
        </nav>

        {/* Right Tools & Controls */}
        <div className="flex items-center gap-2">
          {hasDebugInfo && (
            <button
              onClick={onOpenDebug}
              title="Developer Debug Console"
              className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition text-xs font-medium flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden lg:inline">Debug</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            {settings.theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
