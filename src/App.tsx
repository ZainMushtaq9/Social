import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { 
  MediaItem, CreatorProfileInfo, DownloadTask, GlobalSettings, 
  VideoQuality, ScrapeResponse, AppErrorInfo, DebugInfo, SearchHistoryItem, PlatformType 
} from './types';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ProfileHeaderCard } from './components/ProfileHeaderCard';
import { MediaGrid } from './components/MediaGrid';
import { DownloadManager } from './components/DownloadManager';
import { DownloadModal } from './components/DownloadModal';
import { PreviewModal } from './components/PreviewModal';
import { SettingsView } from './components/SettingsView';
import { DownloadsHistoryView } from './components/DownloadsHistoryView';
import { AboutView } from './components/AboutView';
import { DebugPanel } from './components/DebugPanel';
import { ErrorCard } from './components/ErrorCard';
import { Film, ArrowDownToLine, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'downloads' | 'settings' | 'about'>('home');

  // Extraction State
  const [profile, setProfile] = useState<CreatorProfileInfo | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoadingScrape, setIsLoadingScrape] = useState<boolean>(false);
  const [activeErrorInfo, setActiveErrorInfo] = useState<AppErrorInfo | null>(null);
  const [currentDebugInfo, setCurrentDebugInfo] = useState<DebugInfo | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Search History State (localStorage)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('umd_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Settings State (localStorage)
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem('umd_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      theme: 'dark',
      defaultQuality: 'Best',
      concurrencyLimit: 4,
      lowBandwidthMode: false,
      saveMode: 'individual',
      preserveMetadataFile: true,
      customFilenamePattern: '{author}_{title}_{quality}',
      preferredFormat: 'mp4',
      autoStartDownload: true
    };
  });

  // Active Downloads & Tasks State
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [completedHistoryTasks, setCompletedHistoryTasks] = useState<DownloadTask[]>(() => {
    try {
      const saved = localStorage.getItem('umd_download_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [formatModalMedia, setFormatModalMedia] = useState<MediaItem | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Concurrency Refs
  const activeTaskIdsRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<{ [taskId: string]: AbortController }>({});
  const downloadedChunksRef = useRef<{ [taskId: string]: Uint8Array[] }>({});

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('umd_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Save search history
  useEffect(() => {
    try {
      localStorage.setItem('umd_search_history', JSON.stringify(searchHistory));
    } catch {}
  }, [searchHistory]);

  // Save download history
  useEffect(() => {
    try {
      localStorage.setItem('umd_download_history', JSON.stringify(completedHistoryTasks));
    } catch {}
  }, [completedHistoryTasks]);

  // Toggle Dark/Light Mode
  const handleToggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  // Helper to update settings
  const handleUpdateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Main Scrape Handler
  const handleScrapeUrl = async (rawUrl: string) => {
    setIsLoadingScrape(true);
    setActiveErrorInfo(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const data: ScrapeResponse = await response.json();

      if (data.debugInfo) {
        setCurrentDebugInfo(data.debugInfo);
      }

      if (data.success && data.items && data.items.length > 0) {
        setProfile(data.profile || null);
        setMediaItems(data.items);
        setSelectedIds(new Set(data.items.map(i => i.id)));
        setActiveErrorInfo(null);

        // Add to search history
        const newHistoryItem: SearchHistoryItem = {
          id: String(Date.now()),
          url: rawUrl,
          platform: data.platform || 'other',
          title: data.title || data.items[0].title,
          timestamp: new Date().toISOString(),
          itemCount: data.items.length,
          thumbnailUrl: data.items[0].thumbnailUrl
        };

        setSearchHistory(prev => [newHistoryItem, ...prev.filter(h => h.url !== rawUrl)].slice(0, 10));
      } else {
        const errorObj: AppErrorInfo = {
          type: data.errorType || 'NO_VIDEOS_FOUND',
          title: 'Extraction Notice',
          message: data.message || 'No public streams were found for this URL.',
          details: data.errorDetails || 'The target post or account may be private or restricted.',
          targetUrl: rawUrl,
          suggestions: data.suggestions || [
            'Ensure the link is publicly accessible without logging in',
            'Try pasting a direct Reel or Video URL'
          ],
          debugInfo: data.debugInfo
        };
        setActiveErrorInfo(errorObj);
      }
    } catch (err: any) {
      const netError: AppErrorInfo = {
        type: 'NETWORK_ERROR',
        title: 'Connection / Server Failure',
        message: 'Failed to communicate with extraction backend API.',
        details: err.message || String(err),
        targetUrl: rawUrl,
        suggestions: ['Verify network connection and server status']
      };
      setActiveErrorInfo(netError);
    } finally {
      setIsLoadingScrape(false);
    }
  };

  // Media selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(mediaItems.map(i => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleQualityChange = (id: string, newQuality: VideoQuality) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, selectedQuality: newQuality } : item));
  };

  const handleGlobalQualityChange = (quality: VideoQuality) => {
    setMediaItems(prev => prev.map(item => ({ ...item, selectedQuality: quality })));
  };

  // Format Filename
  const formatFilename = (item: MediaItem, quality: string) => {
    const platformTag = (item.platform || 'MEDIA').toUpperCase();
    const safeAuthor = item.authorName.replace(/[/\\?%*:|"<>]/g, '');
    const safeTitle = item.title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50);
    const ext = settings.preferredFormat === 'mp3' || quality === 'MP3' ? 'mp3' : 'mp4';
    return `[${platformTag}] ${safeAuthor} - ${safeTitle} (${quality}).${ext}`;
  };

  // Enqueue Task
  const enqueueTask = (media: MediaItem, chosenQuality?: VideoQuality) => {
    const quality = chosenQuality || media.selectedQuality;
    const stream = media.qualityStreams.find(s => s.quality === quality) || media.qualityStreams[0];

    const taskId = `${media.id}-${quality}-${Date.now()}`;
    const newTask: DownloadTask = {
      id: taskId,
      media,
      chosenQuality: quality,
      chosenStream: stream,
      status: 'queued',
      progressPercent: 0,
      downloadedBytes: 0,
      totalBytes: Math.round((stream?.fileSizeEstimateMB || 20) * 1024 * 1024),
      speedBps: 0,
      platform: media.platform
    };

    setDownloadTasks(prev => [...prev.filter(t => t.media.id !== media.id), newTask]);
  };

  // Single download trigger
  const handleSingleDownload = (media: MediaItem) => {
    if (media.qualityStreams && media.qualityStreams.length > 1) {
      setFormatModalMedia(media);
    } else {
      enqueueTask(media);
    }
  };

  // Batch download
  const handleStartBatchDownload = () => {
    const selected = mediaItems.filter(i => selectedIds.has(i.id));
    selected.forEach(item => enqueueTask(item));
  };

  // Single task controls
  const handlePauseTask = (taskId: string) => {
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'paused', isPaused: true } : t));
  };

  const handleResumeTask = (taskId: string) => {
    setDownloadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'queued', isPaused: false } : t));
  };

  const handleRetryTask = (taskId: string) => {
    delete downloadedChunksRef.current[taskId];
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'queued', progressPercent: 0 } : t));
  };

  const handleCancelTask = (taskId: string) => {
    delete downloadedChunksRef.current[taskId];
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleCancelAll = () => {
    Object.keys(abortControllersRef.current).forEach(id => {
      abortControllersRef.current[id]?.abort();
    });
    abortControllersRef.current = {};
    downloadedChunksRef.current = {};
    setDownloadTasks([]);
  };

  const handleClearCompletedTasks = () => {
    setDownloadTasks(prev => prev.filter(t => t.status !== 'completed'));
  };

  // Task Stream Worker
  const runTaskDownload = async (task: DownloadTask) => {
    const controller = new AbortController();
    abortControllersRef.current[task.id] = controller;

    const chunks: Uint8Array[] = downloadedChunksRef.current[task.id] || [];
    let receivedBytes = chunks.reduce((acc, c) => acc + c.length, 0);

    setDownloadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'downloading' } : t));

    try {
      const targetFilename = formatFilename(task.media, task.chosenQuality);
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(task.chosenStream.url)}&filename=${encodeURIComponent(targetFilename)}`;

      const headers: Record<string, string> = {};
      if (receivedBytes > 0) {
        headers['Range'] = `bytes=${receivedBytes}-`;
      }

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Media proxy returned HTTP ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      let totalSize = task.totalBytes || 20971520;
      if (contentLengthHeader) {
        totalSize = receivedBytes + parseInt(contentLengthHeader, 10);
      }

      if (!response.body) throw new Error('Proxy stream body unavailable');

      const reader = response.body.getReader();
      const startTime = Date.now();

      while (true) {
        if (controller.signal.aborted) return;

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedChunksRef.current[task.id] = chunks;
        receivedBytes += value.length;

        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentSpeed = elapsedSec > 0 ? value.length / elapsedSec : 0;
        const pct = Math.min(99, Math.round((receivedBytes / totalSize) * 100));

        setDownloadTasks(prev => prev.map(t => t.id === task.id ? {
          ...t,
          progressPercent: pct,
          downloadedBytes: receivedBytes,
          totalBytes: totalSize,
          speedBps: currentSpeed
        } : t));
      }

      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      // Trigger local save
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      delete downloadedChunksRef.current[task.id];
      delete abortControllersRef.current[task.id];

      const completedTask: DownloadTask = {
        ...task,
        status: 'completed',
        progressPercent: 100,
        downloadedBytes: receivedBytes,
        totalBytes: receivedBytes,
        blobUrl,
        savedFileName: targetFilename,
        completedAt: new Date().toISOString()
      };

      setDownloadTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));
      setCompletedHistoryTasks(prev => [completedTask, ...prev.filter(h => h.id !== task.id)]);

    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;

      console.error('Task error:', err);
      setDownloadTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        status: 'failed',
        errorMessage: err.message || 'Download stream interrupted'
      } : t));
    } finally {
      activeTaskIdsRef.current.delete(task.id);
    }
  };

  // Concurrency Loop
  useEffect(() => {
    const queued = downloadTasks.filter(t => t.status === 'queued');
    if (queued.length === 0) return;

    const availableSlots = settings.concurrencyLimit - activeTaskIdsRef.current.size;
    if (availableSlots <= 0) return;

    const tasksToRun = queued.filter(t => !activeTaskIdsRef.current.has(t.id)).slice(0, availableSlots);

    tasksToRun.forEach(task => {
      activeTaskIdsRef.current.add(task.id);
      runTaskDownload(task);
    });
  }, [downloadTasks, settings.concurrencyLimit]);

  // Export ZIP Archive
  const handleDownloadZip = async () => {
    const finished = downloadTasks.filter(t => t.status === 'completed' && t.blobUrl);
    if (finished.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Universal_Downloads');

      for (const task of finished) {
        if (task.blobUrl) {
          const res = await fetch(task.blobUrl);
          const blob = await res.blob();
          folder?.file(task.savedFileName || `${task.id}.mp4`, blob);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipContent);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `Universal_Media_Batch_${finished.length}Files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('ZIP generation failed.');
    } finally {
      setIsZipping(false);
    }
  };

  // Download Map for progress bars
  const activeDownloadsMap: Record<string, number> = {};
  downloadTasks.forEach(t => {
    if (t.status === 'downloading' || t.status === 'queued') {
      activeDownloadsMap[t.media.id] = t.progressPercent;
    }
  });

  return (
    <div className={`min-h-screen ${settings.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-300`}>
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDownloadsCount={downloadTasks.filter(t => t.status === 'downloading').length}
        completedDownloadsCount={completedHistoryTasks.length}
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onOpenDebug={() => setIsDebugOpen(true)}
        hasDebugInfo={!!currentDebugInfo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: HOME EXTRACTOR */}
        {activeTab === 'home' && (
          <>
            <SearchBar
              onSearch={handleScrapeUrl}
              isLoading={isLoadingScrape}
              searchHistory={searchHistory}
              onClearHistory={() => setSearchHistory([])}
              onSelectHistoryItem={(url) => handleScrapeUrl(url)}
            />

            {/* Error Notification */}
            <ErrorCard
              errorInfo={activeErrorInfo}
              onDismiss={() => setActiveErrorInfo(null)}
              onOpenDebug={() => setIsDebugOpen(true)}
            />

            {/* Profile Card Header */}
            {profile && (
              <ProfileHeaderCard
                profile={profile}
                selectedCount={selectedIds.size}
                totalCount={mediaItems.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onStartBatchDownload={handleStartBatchDownload}
                isDownloading={downloadTasks.some(t => t.status === 'downloading')}
              />
            )}

            {/* Active Download Manager Drawer */}
            <DownloadManager
              tasks={downloadTasks}
              settings={settings}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              onRetryTask={handleRetryTask}
              onCancelTask={handleCancelTask}
              onCancelAll={handleCancelAll}
              onClearCompleted={handleClearCompletedTasks}
              onDownloadZip={handleDownloadZip}
              isZipping={isZipping}
            />

            {/* Media Items Grid */}
            {mediaItems.length > 0 && (
              <MediaGrid
                items={mediaItems}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onQualityChange={handleQualityChange}
                onGlobalQualityChange={handleGlobalQualityChange}
                onSingleDownload={handleSingleDownload}
                onOpenPreview={(media) => setPreviewMedia(media)}
                activeDownloads={activeDownloadsMap}
              />
            )}
          </>
        )}

        {/* TAB 2: DOWNLOADS HISTORY */}
        {activeTab === 'downloads' && (
          <DownloadsHistoryView
            completedTasks={completedHistoryTasks}
            onClearHistory={() => setCompletedHistoryTasks([])}
            onRedownload={(task) => enqueueTask(task.media, task.chosenQuality)}
          />
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearHistory={() => {
              setSearchHistory([]);
              setCompletedHistoryTasks([]);
            }}
          />
        )}

        {/* TAB 4: ABOUT */}
        {activeTab === 'about' && <AboutView />}

      </main>

      {/* Modals */}
      <DownloadModal
        media={formatModalMedia}
        onClose={() => setFormatModalMedia(null)}
        onSelectFormat={(media, quality) => enqueueTask(media, quality)}
        onOpenPreview={(media) => setPreviewMedia(media)}
      />

      <PreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
        onDownload={(media, quality) => enqueueTask(media, quality)}
      />

      <DebugPanel
        debugInfo={currentDebugInfo}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500">
        <p>Universal Media Downloader &bull; High-definition multi-platform open source extraction engine.</p>
      </footer>

    </div>
  );
}
