import React, { useState } from 'react';
import { Search, Clipboard, Sparkles, Video, Check, Layers } from 'lucide-react';

interface UrlInputFormProps {
  onScrapeUrl: (url: string) => void;
  isLoading: boolean;
  activeProfileName?: string;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onScrapeUrl,
  isLoading
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && !isLoading) {
      onScrapeUrl(inputUrl.trim());
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard access disallowed or unavailable:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-blue-950/20 text-white transition-all">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Title / Description */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Platform Batch Social Media Video Scraper
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Scrape & Download Videos from YouTube, Instagram, TikTok, Facebook & More
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            <span>Powered by <strong className="text-emerald-400 font-semibold">yt-dlp core engine</strong>.</span>
            <span>Extracts video streams in 1080p, 720p, and SD/HD quality with thumbnails for direct local drive saving.</span>
          </p>

          {/* Social Platform Badges */}
          <div className="flex items-center justify-center gap-1.5 pt-1.5 flex-wrap text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">YouTube / Shorts</span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30">Instagram / Reels</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">TikTok</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-600/30">Facebook</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">Twitter / X</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">Pinterest</span>
          </div>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className="relative space-y-2">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-blue-400" />
            </div>

            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste YouTube, Instagram, TikTok, Facebook, or Twitter link..."
              className="w-full pl-11 pr-28 sm:pr-36 py-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-all shadow-inner"
              required
            />

            {/* Paste & Clear actions */}
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Pasted
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Paste
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || !inputUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Scrape Videos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
