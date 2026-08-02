import React from 'react';
import { GlobalSettings, VideoQuality } from '../types';
import { Settings, Sliders, HardDrive, ShieldCheck, Zap, Trash2, FileText, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: Partial<GlobalSettings>) => void;
  onClearHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClearHistory
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          <span>Application Preferences</span>
        </h2>
        <p className="text-xs text-slate-400">
          Customize video extraction quality, concurrency threads, file naming patterns, and caching behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Downloads & Quality */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Default Stream Settings</span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Preferred Quality */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Default Video Quality</label>
              <select
                value={settings.defaultQuality}
                onChange={(e) => onUpdateSettings({ defaultQuality: e.target.value as VideoQuality })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="Best">Best Available (4K / 1080p)</option>
                <option value="2160p">2160p (4K Ultra HD)</option>
                <option value="1440p">1440p (2K Quad HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (HD)</option>
                <option value="480p">480p (SD)</option>
                <option value="MP3">Audio Only (MP3)</option>
              </select>
            </div>

            {/* Concurrency Limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Concurrent Downloads Limit</span>
                <span className="text-blue-400 font-bold">{settings.concurrencyLimit} Threads</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={settings.concurrencyLimit}
                onChange={(e) => onUpdateSettings({ concurrencyLimit: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Preferred Format */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Preferred Container Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['mp4', 'webm', 'mp3'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onUpdateSettings({ preferredFormat: fmt })}
                    className={`py-2 rounded-xl border text-xs font-bold uppercase transition ${
                      settings.preferredFormat === fmt
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Card 2: Filename & Bandwidth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Filename & Data Optimization</span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Custom Filename Pattern */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Save Filename Pattern</label>
              <input
                type="text"
                value={settings.customFilenamePattern}
                onChange={(e) => onUpdateSettings({ customFilenamePattern: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Variables: <code className="text-blue-400 font-mono">&#123;author&#125;</code>, <code className="text-blue-400 font-mono">&#123;title&#125;</code>, <code className="text-blue-400 font-mono">&#123;quality&#125;</code>
              </p>
            </div>

            {/* Low Bandwidth Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-200">Low Bandwidth Mode</p>
                <p className="text-[11px] text-slate-400">Skip high resolution thumbnails and heavy metadata parsing.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.lowBandwidthMode}
                onChange={(e) => onUpdateSettings({ lowBandwidthMode: e.target.checked })}
                className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {/* Clear Storage */}
            <div className="pt-2">
              <button
                onClick={onClearHistory}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Search & Download History</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
