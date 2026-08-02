import React, { useState } from 'react';
import { Search, Clipboard, Sparkles, Loader2, ArrowRight, Trash2, Globe, Clock } from 'lucide-react';
import { PlatformType, SearchHistoryItem } from '../types';

interface SearchBarProps {
  onSearch: (url: string) => void;
  isLoading: boolean;
  searchHistory: SearchHistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (url: string) => void;
}

const PLATFORMS: { id: PlatformType; name: string; color: string }[] = [
  { id: 'youtube', name: 'YouTube', color: 'from-red-600 to-red-500' },
  { id: 'facebook', name: 'Facebook', color: 'from-blue-600 to-blue-500' },
  { id: 'instagram', name: 'Instagram', color: 'from-pink-600 to-purple-600' },
  { id: 'tiktok', name: 'TikTok', color: 'from-cyan-500 to-slate-900' },
  { id: 'twitter', name: 'X / Twitter', color: 'from-slate-700 to-slate-900' },
  { id: 'pinterest', name: 'Pinterest', color: 'from-red-700 to-red-600' },
  { id: 'reddit', name: 'Reddit', color: 'from-orange-600 to-red-500' },
  { id: 'threads', name: 'Threads', color: 'from-zinc-700 to-zinc-900' },
  { id: 'vimeo', name: 'Vimeo', color: 'from-sky-500 to-blue-600' },
  { id: 'soundcloud', name: 'SoundCloud', color: 'from-orange-500 to-amber-600' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  searchHistory,
  onClearHistory,
  onSelectHistoryItem,
}) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && !isLoading) {
      onSearch(inputUrl.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        if (text.startsWith('http')) {
          onSearch(text.trim());
        }
      }
    } catch {
      // Clipboard access rejected
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pt-4">
      
      {/* Title & Subtitle */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Download Any Media from Any Platform
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
          Paste a public profile, reel, video, shorts, post, or playlist URL. Auto-detects streams, resolutions up to 4K, and audio.
        </p>
      </div>

      {/* Hero Input Box */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>

        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-2xl">
          
          <div className="pl-3 text-slate-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste media link (YouTube, Facebook, IG Reel, TikTok, Twitter...)"
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none px-2 py-2"
          />

          {inputUrl ? (
            <button
              type="button"
              onClick={() => setInputUrl('')}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePaste}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition shrink-0"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-400" />
              <span>Paste</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Supported Platforms Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {PLATFORMS.map((p) => (
          <span
            key={p.id}
            className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:border-slate-700 transition cursor-default shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${p.color}`}></span>
            <span>{p.name}</span>
          </span>
        ))}
      </div>

      {/* Search History Tags */}
      {searchHistory.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={onClearHistory}
              className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {searchHistory.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setInputUrl(item.url);
                  onSelectHistoryItem(item.url);
                }}
                className="max-w-xs truncate px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition text-left"
              >
                <span className="text-blue-400 font-semibold uppercase mr-1.5">[{item.platform}]</span>
                <span>{item.title || item.url}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
