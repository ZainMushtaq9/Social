import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Navbar } from './components/Navbar';
import { UrlInputForm } from './components/UrlInputForm';
import { ProfileHeaderCard } from './components/ProfileHeaderCard';
import { VideoGrid } from './components/VideoGrid';
import { DownloadManager } from './components/DownloadManager';
import { VideoModal } from './components/VideoModal';
import { SettingsModal } from './components/SettingsModal';
import { ErrorReportModal } from './components/ErrorReportModal';
import { 
  FacebookProfileInfo, FacebookVideo, DownloadTask, 
  GlobalDownloadSettings, VideoQuality, ScrapeResponse, AppErrorInfo 
} from './types';
import { Download, ShieldCheck, Zap, Sparkles, CheckCircle2, Film, ArrowDownToLine, Layers, Radio, AlertCircle, Bug } from 'lucide-react';

export default function App() {
  // State
  const [profile, setProfile] = useState<FacebookProfileInfo | null>(null);
  const [videos, setVideos] = useState<FacebookVideo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [isLoadingScrape, setIsLoadingScrape] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeErrorInfo, setActiveErrorInfo] = useState<AppErrorInfo | null>(null);
  const [previewVideo, setPreviewVideo] = useState<FacebookVideo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const [settings, setSettings] = useState<GlobalDownloadSettings>({
    defaultQuality: 'Best',
    concurrencyLimit: 8,
    lowBandwidthMode: false,
    saveMode: 'individual',
    preserveMetadataFile: true,
    customFilenamePattern: '{author}_{title}_{quality}'
  });

  // Active concurrency queue tracking & chunk buffers
  const activeTaskIdsRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<{ [taskId: string]: AbortController }>({});
  const downloadedChunksRef = useRef<{ [taskId: string]: Uint8Array[] }>({});

  // Helper to update settings
  const handleUpdateSettings = (newSettings: Partial<GlobalDownloadSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Scrape URL handler
  const handleScrapeUrl = async (rawUrl: string, dateFrom?: string, dateTo?: string) => {
    setIsLoadingScrape(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: rawUrl,
          dateFrom,
          dateTo,
          lowBandwidthMode: settings.lowBandwidthMode
        })
      });

      let data: ScrapeResponse;
      try {
        data = await response.json();
      } catch (jsonErr) {
        const errorObj: AppErrorInfo = {
          type: 'UNKNOWN',
          title: 'Invalid Server Response',
          message: 'The server returned an invalid or unparseable JSON response format.',
          details: String(jsonErr),
          targetUrl: rawUrl,
          statusCode: response.status,
          suggestions: [
            'Verify server connection',
            'Check server endpoint health in devtools'
          ]
        };
        setActiveErrorInfo(errorObj);
        setErrorMessage('Server returned an invalid response format.');
        return;
      }

      if (data.success && data.videos && data.videos.length > 0) {
        if (data.profile) {
          setProfile(data.profile);
        }
        setVideos(data.videos);
        setSelectedIds(new Set(data.videos.map(v => v.id)));
        setErrorMessage(null);
        setActiveErrorInfo(null);
      } else if (data.success && (data.profile || data.isProfileOnly)) {
        if (data.profile) {
          setProfile(data.profile);
        }
        setVideos([]);
        setSelectedIds(new Set());
        setErrorMessage(null);
        setActiveErrorInfo(null);
      } else {
        const friendlyMsg = data.message || 'No public video streams found for this link. Please make sure the link is public and accessible.';
        setErrorMessage(friendlyMsg);
        
        // Prepare diagnostic error payload
        const errorObj: AppErrorInfo = {
          type: data.errorType || 'NO_VIDEOS_FOUND',
          title: data.errorType === 'INVALID_URL' ? 'Invalid Link Format' : data.errorType === 'PRIVATE_RESTRICTED' ? 'Restricted / Private Post' : 'No Public Videos Found',
          message: friendlyMsg,
          details: data.errorDetails || 'yt-dlp and HTML scraper pipeline yielded 0 stream results.',
          targetUrl: rawUrl,
          statusCode: response.status,
          suggestions: data.suggestions || [
            'Make sure the post or reel is set to Public',
            'Try pasting a direct Reel link (e.g. facebook.com/reel/...)',
            'Verify that the URL was copied correctly'
          ]
        };
        
        // Save current profile metadata if present even if 0 videos returned
        if (data.profile) {
          setProfile(data.profile);
        }
        
        setActiveErrorInfo(errorObj);
      }
    } catch (err: any) {
      console.error('Scrape request failed:', err);
      const networkError: AppErrorInfo = {
        type: 'NETWORK_ERROR',
        title: 'Connection / Network Failure',
        message: 'Unable to connect to the scraper service. Please check network or URL.',
        details: err.stack || err.message,
        targetUrl: rawUrl,
        suggestions: [
          'Verify your network connection',
          'Ensure dev server port 3000 is active'
        ]
      };
      setActiveErrorInfo(networkError);
      setErrorMessage('Unable to connect to the scraper service. Please check network or URL.');
    } finally {
      setIsLoadingScrape(false);
    }
  };

  // Video selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(videos.map(v => v.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Quality per video change
  const handleQualityChange = (id: string, newQuality: VideoQuality) => {
    setVideos(prev =>
      prev.map(v => (v.id === id ? { ...v, selectedQuality: newQuality } : v))
    );
  };

  // Global quality override
  const handleGlobalQualityChange = (quality: VideoQuality) => {
    setVideos(prev => prev.map(v => ({ ...v, selectedQuality: quality })));
  };

  // Format filename with metadata preservation
  const formatFilename = (video: FacebookVideo, quality: string) => {
    const platformTag = (video.platform || 'Social').toUpperCase();
    const safeAuthor = video.authorName.replace(/[/\\?%*:|"<>]/g, '');
    const safeTitle = video.title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50);
    const date = video.uploadDate || new Date().toISOString().slice(0, 10);
    return `[${platformTag}] ${safeAuthor} - ${safeTitle} (${quality} - ${date}).mp4`;
  };

  // Trigger individual video download or enqueue task
  const enqueueDownloadTask = (video: FacebookVideo, chosenQuality?: VideoQuality) => {
    const quality = chosenQuality || video.selectedQuality;
    const stream = video.qualityStreams.find(s => s.quality === quality) || video.qualityStreams[0];

    const taskId = `${video.id}-${quality}-${Date.now()}`;
    const newTask: DownloadTask = {
      id: taskId,
      video,
      chosenQuality: quality,
      chosenStream: stream,
      status: 'queued',
      progressPercent: 0,
      downloadedBytes: 0,
      totalBytes: Math.round((stream?.fileSizeEstimateMB || 20) * 1024 * 1024),
      speedBps: 0,
      platform: video.platform
    };

    setDownloadTasks(prev => [...prev.filter(t => t.video.id !== video.id), newTask]);
  };

  // Start batch download for all selected videos
  const handleStartBatchDownload = () => {
    const selectedVideos = videos.filter(v => selectedIds.has(v.id));
    if (selectedVideos.length === 0) return;

    selectedVideos.forEach(v => {
      enqueueDownloadTask(v);
    });
  };

  // Pause single task
  const handlePauseTask = (taskId: string) => {
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'paused', isPaused: true, speedBps: 0 } : t))
    );
  };

  // Resume paused task
  const handleResumeTask = (taskId: string) => {
    setDownloadTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'queued', isPaused: false } : t))
    );
  };

  // Retry failed task
  const handleRetryTask = (taskId: string) => {
    delete downloadedChunksRef.current[taskId];
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'queued', progressPercent: 0, downloadedBytes: 0, speedBps: 0 } : t))
    );
  };

  // Cancel single task
  const handleCancelTask = (taskId: string) => {
    delete downloadedChunksRef.current[taskId];
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setDownloadTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Cancel all tasks
  const handleCancelAll = () => {
    Object.keys(abortControllersRef.current).forEach(id => {
      abortControllersRef.current[id]?.abort();
    });
    abortControllersRef.current = {};
    downloadedChunksRef.current = {};
    setDownloadTasks([]);
  };

  // Clear completed tasks
  const handleClearCompleted = () => {
    setDownloadTasks(prev => prev.filter(t => t.status !== 'completed'));
  };

  // Worker function to download a single task in parallel
  const runTaskDownload = async (task: DownloadTask) => {
    // Create AbortController for pause/cancel
    const controller = new AbortController();
    abortControllersRef.current[task.id] = controller;

    // Existing chunks for resume capability
    const chunks: Uint8Array[] = downloadedChunksRef.current[task.id] || [];
    let receivedBytes = chunks.reduce((acc, c) => acc + c.length, 0);

    // Mark task as downloading
    setDownloadTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: 'downloading', isPaused: false } : t))
    );

    try {
      const targetFilename = formatFilename(task.video, task.chosenQuality);
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(task.chosenStream.url)}&filename=${encodeURIComponent(targetFilename)}`;

      const fetchHeaders: Record<string, string> = {};
      if (receivedBytes > 0) {
        fetchHeaders['Range'] = `bytes=${receivedBytes}-`;
      }

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: fetchHeaders
      });

      if (!response.ok && response.status !== 206) {
        let errorMsg = `Download failed (HTTP ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson.error) {
            errorMsg = errJson.error;
          }
        } catch (e) {
          // ignore JSON parse error
        }
        throw new Error(errorMsg);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const contentRangeHeader = response.headers.get('content-range');

      let totalSize = task.totalBytes || 20971520;
      if (contentRangeHeader) {
        const match = contentRangeHeader.match(/\/(\d+)/);
        if (match && match[1]) {
          totalSize = parseInt(match[1], 10);
        }
      } else if (contentLengthHeader) {
        totalSize = receivedBytes + parseInt(contentLengthHeader, 10);
      }

      if (!response.body) {
        throw new Error('Response body stream unavailable');
      }

      const reader = response.body.getReader();
      const startTime = Date.now();

      while (true) {
        if (controller.signal.aborted) {
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedChunksRef.current[task.id] = chunks;
        receivedBytes += value.length;

        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentSpeed = elapsedSec > 0 ? value.length / elapsedSec : 0;
        const pct = Math.min(99, Math.round((receivedBytes / totalSize) * 100));

        setDownloadTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  progressPercent: pct,
                  downloadedBytes: receivedBytes,
                  totalBytes: totalSize,
                  speedBps: currentSpeed
                }
              : t
          )
        );
      }

      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      // Immediately trigger local disk download save
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      delete downloadedChunksRef.current[task.id];
      delete abortControllersRef.current[task.id];

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 15000);

      // Complete task
      setDownloadTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed',
                progressPercent: 100,
                downloadedBytes: receivedBytes,
                totalBytes: receivedBytes,
                blobUrl,
                savedFileName: targetFilename
              }
            : t
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log(`Task ${task.id} stream paused or cancelled.`);
        return;
      }

      console.error('Download error:', err);
      setDownloadTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: 'failed',
                errorMessage: err.message || 'Download failed due to network or stream error'
              }
            : t
        )
      );
    } finally {
      activeTaskIdsRef.current.delete(task.id);
    }
  };

  // Concurrent Task Dispatcher Effect
  useEffect(() => {
    const queuedTasks = downloadTasks.filter(t => t.status === 'queued');
    if (queuedTasks.length === 0) return;

    const availableSlots = settings.concurrencyLimit - activeTaskIdsRef.current.size;
    if (availableSlots <= 0) return;

    const tasksToStart = queuedTasks
      .filter(t => !activeTaskIdsRef.current.has(t.id))
      .slice(0, availableSlots);

    tasksToStart.forEach(task => {
      activeTaskIdsRef.current.add(task.id);
      runTaskDownload(task);
    });
  }, [downloadTasks, settings.concurrencyLimit]);

  // Export finished videos as a single ZIP Archive with metadata
  const handleDownloadZip = async () => {
    const completedTasks = downloadTasks.filter(t => t.status === 'completed' && t.blobUrl);
    if (completedTasks.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Create folder for videos
      const folderName = `${profile?.name || 'Facebook'}_Videos`;
      const videoFolder = zip.folder(folderName);

      // Manifest summary
      const metadataManifest = {
        exportedAt: new Date().toISOString(),
        profile: profile,
        videos: completedTasks.map(t => ({
          title: t.video.title,
          description: t.video.description,
          author: t.video.authorName,
          uploadDate: t.video.uploadDate,
          quality: t.chosenQuality,
          resolution: t.chosenStream.resolution,
          views: t.video.viewsCount,
          originalPostUrl: t.video.originalPostUrl,
          filename: t.savedFileName
        }))
      };

      videoFolder?.file('metadata_manifest.json', JSON.stringify(metadataManifest, null, 2));

      // Fetch blobs and append to zip
      for (const task of completedTasks) {
        if (task.blobUrl) {
          const response = await fetch(task.blobUrl);
          const blobData = await response.blob();
          const fileName = task.savedFileName || `${task.video.id}.mp4`;
          videoFolder?.file(fileName, blobData);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipContent);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `[FB_Batch]_${profile?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Videos'}_${completedTasks.length}Files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (zipErr) {
      console.error('Zipping failed:', zipErr);
      alert('Failed to generate ZIP package.');
    } finally {
      setIsZipping(false);
    }
  };

  // Map active download progress percent for badges
  const activeDownloadsMap: Record<string, number> = {};
  downloadTasks.forEach(t => {
    if (t.status === 'downloading' || t.status === 'queued') {
      activeDownloadsMap[t.video.id] = t.progressPercent;
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeDownloadsCount={downloadTasks.filter(t => t.status === 'downloading').length}
        totalSelectedCount={selectedIds.size}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Search Input Section */}
        <UrlInputForm
          onScrapeUrl={handleScrapeUrl}
          isLoading={isLoadingScrape}
          activeProfileName={profile?.name}
        />

        {/* Error / Status Notice */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm leading-relaxed">
                <p className="font-semibold text-amber-300 mb-0.5">Extraction Notice</p>
                <p className="text-amber-200/90">{errorMessage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {activeErrorInfo && (
                <button
                  onClick={() => setActiveErrorInfo(activeErrorInfo)}
                  className="text-amber-300 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition flex items-center gap-1.5"
                >
                  <Bug className="w-3.5 h-3.5 text-amber-400" />
                  <span>Debug & Report</span>
                </button>
              )}

              <button
                onClick={() => setErrorMessage(null)}
                className="text-amber-400 hover:text-amber-200 text-xs font-medium px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-900 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Profile Card Header */}
        {profile && (
          <ProfileHeaderCard
            profile={profile}
            selectedCount={selectedIds.size}
            totalCount={videos.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onStartBatchDownload={handleStartBatchDownload}
            isDownloading={downloadTasks.some(t => t.status === 'downloading')}
            lowBandwidthMode={settings.lowBandwidthMode}
            onScrapeUrl={handleScrapeUrl}
          />
        )}

        {/* Batch Download Manager Bar */}
        <DownloadManager
          tasks={downloadTasks}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onPauseTask={handlePauseTask}
          onResumeTask={handleResumeTask}
          onRetryTask={handleRetryTask}
          onCancelTask={handleCancelTask}
          onCancelAll={handleCancelAll}
          onClearCompleted={handleClearCompleted}
          onDownloadZip={handleDownloadZip}
          isZipping={isZipping}
          onOpenPreview={(video) => setPreviewVideo(video)}
          onOpenReportModal={(info) => setActiveErrorInfo(info)}
        />

        {/* Videos Grid or Empty State */}
        {videos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 max-w-3xl mx-auto my-8 space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Film className="w-8 h-8 text-blue-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {profile ? `Loaded Facebook Profile: ${profile.name}` : 'No Facebook Media Loaded'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                {profile ? (
                  <span>
                    The share link points to the main profile page for <strong className="text-blue-400">{profile.name}</strong>. To extract and download video files or reels from this creator, please paste a direct Facebook <strong className="text-blue-400">Video</strong> or <strong className="text-blue-400">Reel</strong> share link.
                  </span>
                ) : (
                  <span>
                    Paste a public Facebook profile, reel, page, or watch URL above and click <strong className="text-blue-400">"Scrape Videos"</strong> to extract downloadable media files.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-left text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Enter Facebook Link
                </div>
                <p className="text-[11px] text-slate-400">Copy any public video, reel, or share link from Facebook.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  yt-dlp + HTML Extraction
                </div>
                <p className="text-[11px] text-slate-400">Dual-engine pipeline extracts 1080p Full HD & 720p SD streams.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Batch Local Save
                </div>
                <p className="text-[11px] text-slate-400">Save directly to your local drive or download as a zip archive.</p>
              </div>
            </div>
          </div>
        ) : (
          <VideoGrid
            videos={videos}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onQualityChange={handleQualityChange}
            onGlobalQualityChange={handleGlobalQualityChange}
            onSingleDownload={(video) => enqueueDownloadTask(video)}
            onOpenPreview={(video) => setPreviewVideo(video)}
            activeDownloads={activeDownloadsMap}
            lowBandwidthMode={settings.lowBandwidthMode}
          />
        )}

      </main>

      {/* Modals */}
      <VideoModal
        video={previewVideo}
        onClose={() => setPreviewVideo(null)}
        onDownload={(video, quality) => enqueueDownloadTask(video, quality)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <ErrorReportModal
        errorInfo={activeErrorInfo}
        onClose={() => setActiveErrorInfo(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 text-center text-xs text-slate-500 space-y-2">
        <p className="flex items-center justify-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Facebook Batch Video Downloader • Highest Resolution Extraction • Metadata Preserved</span>
        </p>
        <p className="text-slate-600">
          Supports concurrent multi-stream downloading, custom resolutions, mobile browser optimization, and low-bandwidth mode.
        </p>
      </footer>

    </div>
  );
}
