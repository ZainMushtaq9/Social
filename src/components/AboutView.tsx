import React from 'react';
import { Film, ShieldCheck, Zap, Layers, Globe, Code, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-6 animate-fadeIn">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto shadow-xl">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Film className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Universal Media Downloader Architecture
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Production-grade open source media extraction platform supporting high-definition video, audio, reels, playlists, and profiles.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">Multi-Platform Detection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Auto-detects URLs from YouTube, Facebook, Instagram, TikTok, X/Twitter, Pinterest, Reddit, Threads, Vimeo, Dailymotion, SoundCloud, and gallery websites.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">4K Stream Resolution</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts highest quality streams up to 2160p (4K UHD), 1440p (2K), 1080p, and high quality 320kbps MP3 audio extraction.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">Zero Tracking & Privacy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically strips tracking query parameters (<code className="text-cyan-300">fbclid</code>, <code className="text-cyan-300">igshid</code>, <code className="text-cyan-300">utm_*</code>) before scraping.
          </p>
        </div>

      </div>

      {/* Extraction Pipeline Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>Extraction Pipeline & Failover Engine</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Primary: yt-dlp Native CLI
            </p>
            <p className="text-slate-400 leading-relaxed">
              Executes yt-dlp JSON dump pipeline for complete format list, bitrate calculation, and codec information.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Fallback: OpenGraph & OEmbed Scraper
            </p>
            <p className="text-slate-400 leading-relaxed">
              Parses OpenGraph meta tags, JSON-LD, and HTML5 video element source tags for instant public stream retrieval.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
