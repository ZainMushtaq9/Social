export type PlatformType = 
  | 'youtube' 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'twitter' 
  | 'pinterest' 
  | 'reddit' 
  | 'threads' 
  | 'vimeo' 
  | 'dailymotion' 
  | 'soundcloud' 
  | 'other';

export type UrlType = 
  | 'video' 
  | 'reel' 
  | 'shorts' 
  | 'playlist' 
  | 'channel' 
  | 'profile' 
  | 'page' 
  | 'gallery' 
  | 'share' 
  | 'unknown';

export type VideoQuality = '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'SD' | 'HD' | 'Best' | 'Audio Only' | 'MP3';

export interface QualityStream {
  quality: VideoQuality;
  label: string;
  resolution: string;      // e.g. "3840x2160"
  bitrate?: string;        // e.g. "12.5 Mbps"
  codec?: string;          // e.g. "h264" / "vp9" / "aac"
  container?: string;      // e.g. "mp4" / "webm" / "mp3"
  fileSizeEstimateMB: number;
  url: string;
  hasAudio?: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  thumbnailUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  uploadDate: string;      // YYYY-MM-DD
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  originalPostUrl: string;
  isReel?: boolean;
  platform: PlatformType;
  qualityStreams: QualityStream[];
  selectedQuality: VideoQuality;
  isVideo?: boolean;
  isAudio?: boolean;
  isGalleryItem?: boolean;
  galleryImages?: string[];
}

export interface CreatorProfileInfo {
  url: string;
  name: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  verified: boolean;
  followersCount: number;
  totalVideosFound: number;
  category: string;
  bio: string;
  platform: PlatformType;
  extractionTimeMs: number;
}

export type DownloadStatus = 
  | 'idle' 
  | 'queued' 
  | 'fetching_metadata' 
  | 'downloading' 
  | 'paused' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface DownloadTask {
  id: string;
  media: MediaItem;
  chosenQuality: VideoQuality;
  chosenStream: QualityStream;
  status: DownloadStatus;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  errorMessage?: string;
  savedFileName?: string;
  blobUrl?: string;
  isPaused?: boolean;
  platform: PlatformType;
  startedAt?: string;
  completedAt?: string;
}

export interface GlobalSettings {
  theme: 'dark' | 'light' | 'system';
  defaultQuality: VideoQuality;
  concurrencyLimit: number;
  lowBandwidthMode: boolean;
  saveMode: 'individual' | 'zip';
  preserveMetadataFile: boolean;
  customFilenamePattern: string;
  preferredFormat: 'mp4' | 'webm' | 'mp3';
  autoStartDownload: boolean;
}

export interface DebugInfo {
  originalUrl: string;
  cleanedUrl: string;
  resolvedUrl: string;
  redirectChain: string[];
  detectedPlatform: PlatformType;
  detectedUrlType: UrlType;
  selectedExtractionEngine: string;
  processingTimeMs: number;
  playwrightLogs?: string[];
  ytDlpCommand?: string;
  ytDlpStdoutSnippet?: string;
  ytDlpStderrSnippet?: string;
  extractionError?: string;
  scrapedAt: string;
}

export interface AppErrorInfo {
  type: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'PRIVATE_RESTRICTED' | 'NO_VIDEOS_FOUND' | 'DOWNLOAD_FAILED' | 'NETWORK_ERROR' | 'RATE_LIMITED' | 'UNKNOWN';
  title: string;
  message: string;
  details?: string;
  targetUrl?: string;
  timestamp?: string;
  statusCode?: number;
  suggestions?: string[];
  debugInfo?: DebugInfo;
}

export interface ScrapeResponse {
  success: boolean;
  platform?: PlatformType;
  urlType?: UrlType;
  title?: string;
  profile?: CreatorProfileInfo | null;
  items: MediaItem[];
  scrapedAt: string;
  message?: string;
  errorType?: AppErrorInfo['type'];
  errorDetails?: string;
  suggestions?: string[];
  debugInfo?: DebugInfo;
}

export interface SearchHistoryItem {
  id: string;
  url: string;
  platform: PlatformType;
  title: string;
  timestamp: string;
  itemCount: number;
  thumbnailUrl?: string;
}
