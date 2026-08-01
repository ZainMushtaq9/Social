import React from 'react';
import { X, Sliders, Shield, HardDrive, Wifi, FileText, Check } from 'lucide-react';
import { GlobalDownloadSettings, VideoQuality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalDownloadSettings;
  onUpdateSettings: (newSettings: Partial<GlobalDownloadSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white p-5 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">
              Batch Download Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          
          {/* Concurrency Limit */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Max Concurrent Downloads ({settings.concurrencyLimit} active streams)
            </label>
            <p className="text-slate-400 text-[11px]">
              Controls how many videos download simultaneously. Higher values speed up large playlists on fast internet.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => onUpdateSettings({ concurrencyLimit: val })}
                  className={`flex-1 py-2 rounded-xl border font-bold text-center transition-all ${
                    settings.concurrencyLimit === val
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {val}x Stream{val > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Default Resolution */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-200 block">
              Default Auto Quality
            </label>
            <select
              value={settings.defaultQuality}
              onChange={(e) => onUpdateSettings({ defaultQuality: e.target.value as VideoQuality })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none"
            >
              <option value="Best">Best Available (1080p / 720p Auto)</option>
              <option value="1080p">1080p Full HD Only</option>
              <option value="720p">720p HD Standard</option>
              <option value="480p">480p SD Mobile</option>
            </select>
          </div>

          {/* Save Mode */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-200 block">
              File Save Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ saveMode: 'individual' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.saveMode === 'individual'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <HardDrive className="w-4 h-4 text-blue-400 mb-1" />
                <div className="font-bold text-white">Direct MP4 Files (Local Drive)</div>
                <div className="text-[10px] text-slate-400">Downloads MP4 files directly into local device storage / Downloads folder</div>
              </button>

              <button
                onClick={() => onUpdateSettings({ saveMode: 'zip' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.saveMode === 'zip'
                    ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-400 mb-1" />
                <div className="font-bold text-white">Bundle ZIP to Local Drive</div>
                <div className="text-[10px] text-slate-400">Downloads single ZIP file with videos & manifest directly to local drive</div>
              </button>
            </div>
          </div>

          {/* Low Bandwidth Mode Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Low Bandwidth Mode</span>
              <span className="text-slate-400 text-[11px] block">Disables heavy image previews on slow mobile data</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ lowBandwidthMode: !settings.lowBandwidthMode })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                settings.lowBandwidthMode ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.lowBandwidthMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
