export type VideoQuality = '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'SD' | 'HD' | 'Best' | 'Audio Only';

export type PlatformType = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'pinterest' | 'vimeo' | 'other';

export interface QualityStream {
  quality: VideoQuality;
  label: string;
  resolution: string; // e.g. "1920x1080"
  bitrate: string;    // e.g. "4.8 Mbps"
  fileSizeEstimateMB: number;
  url: string;
}

export interface FacebookVideo {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  thumbnailUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  uploadDate: string; // YYYY-MM-DD
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  originalPostUrl: string;
  isReel?: boolean;
  platform?: PlatformType;
  qualityStreams: QualityStream[];
  selectedQuality: VideoQuality;
}

export interface FacebookProfileInfo {
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
  platform?: PlatformType;
}

export type DownloadStatus = 
  | 'idle' 
  | 'queued' 
  | 'fetching_metadata' 
  | 'downloading' 
  | 'paused'
  | 'processing_metadata' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface DownloadTask {
  id: string;
  video: FacebookVideo;
  chosenQuality: VideoQuality;
  chosenStream: QualityStream;
  status: DownloadStatus;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number; // bytes per sec
  errorMessage?: string;
  savedFileName?: string;
  blobUrl?: string;
  isPaused?: boolean;
  platform?: PlatformType;
  startedAt?: string;
  completedAt?: string;
}

export interface GlobalDownloadSettings {
  defaultQuality: VideoQuality;
  concurrencyLimit: number; // 1 to 5
  lowBandwidthMode: boolean;
  saveMode: 'individual' | 'zip';
  preserveMetadataFile: boolean;
  customFilenamePattern: string; // e.g. "{author}_{title}_{quality}"
}

export interface AppErrorInfo {
  type: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'PRIVATE_RESTRICTED' | 'NO_VIDEOS_FOUND' | 'DOWNLOAD_FAILED' | 'NETWORK_ERROR' | 'UNKNOWN';
  title: string;
  message: string;
  details?: string;
  targetUrl?: string;
  timestamp?: string;
  videoId?: string;
  statusCode?: number;
  suggestions?: string[];
}

export interface ScrapeResponse {
  success: boolean;
  isProfileOnly?: boolean;
  profile?: FacebookProfileInfo;
  videos: FacebookVideo[];
  scrapedAt: string;
  message?: string;
  errorType?: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'PRIVATE_RESTRICTED' | 'NO_VIDEOS_FOUND' | 'NETWORK_ERROR' | 'UNKNOWN';
  errorDetails?: string;
  suggestions?: string[];
}

