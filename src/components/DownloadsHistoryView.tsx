import React, { useState } from 'react';
import { DownloadTask } from '../types';
import { History, Download, Trash2, ExternalLink, Search, Film, CheckCircle2 } from 'lucide-react';

interface DownloadsHistoryViewProps {
  completedTasks: DownloadTask[];
  onClearHistory: () => void;
  onRedownload: (task: DownloadTask) => void;
}

export const DownloadsHistoryView: React.FC<DownloadsHistoryViewProps> = ({
  completedTasks,
  onClearHistory,
  onRedownload
}) => {
  const [filterText, setFilterText] = useState('');

  const filtered = completedTasks.filter(t => 
    t.media.title.toLowerCase().includes(filterText.toLowerCase()) ||
    t.media.authorName.toLowerCase().includes(filterText.toLowerCase()) ||
    t.platform.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Download History</span>
          </h2>
          <p className="text-xs text-slate-400">
            {completedTasks.length} media items saved in local browser cache.
          </p>
        </div>

        {completedTasks.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {completedTasks.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search saved videos by title, creator, or platform..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3 max-w-lg mx-auto my-8">
          <Film className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Download History Found</h3>
          <p className="text-xs text-slate-400">
            {completedTasks.length === 0 
              ? 'Your completed downloads will appear here for quick access and re-export.' 
              : 'No items match your filter search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center gap-4 group"
            >
              <img
                src={task.media.thumbnailUrl}
                alt={task.media.title}
                className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
              />

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {task.platform}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{task.chosenQuality}</span>
                </div>

                <h4 className="font-bold text-white text-xs truncate group-hover:text-blue-400 transition">
                  {task.media.title}
                </h4>

                <p className="text-[11px] text-slate-400">
                  {task.media.authorName} &bull; {(task.totalBytes / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={task.media.originalPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Source URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => onRedownload(task)}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                  title="Download Again"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
