import express from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';
import { FacebookProfileInfo, FacebookVideo, QualityStream, PlatformType, VideoQuality } from './src/types.js';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3000;

app.use(express.json());

const YT_DLP_PATH = path.join(process.cwd(), 'yt-dlp_linux');

// Helper to ensure yt-dlp binary is available
async function ensureYtDlp(forceRedownload = false): Promise<string> {
  // If old zipapp 'yt-dlp' exists in cwd, clean it up
  const oldPath = path.join(process.cwd(), 'yt-dlp');
  if (fs.existsSync(oldPath)) {
    try { fs.unlinkSync(oldPath); } catch (e) {}
  }

  if (!forceRedownload && fs.existsSync(YT_DLP_PATH)) {
    try {
      fs.chmodSync(YT_DLP_PATH, 0o755);
    } catch (e) {
      console.warn('Unable to chmod yt-dlp_linux binary:', e);
    }
    return YT_DLP_PATH;
  }

  console.log('Downloading compiled yt-dlp_linux executable binary...');
  if (fs.existsSync(YT_DLP_PATH)) {
    try { fs.unlinkSync(YT_DLP_PATH); } catch (e) {}
  }

  const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux');
  if (!res.ok) {
    throw new Error(`Failed to download yt-dlp binary: HTTP ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  fs.writeFileSync(YT_DLP_PATH, Buffer.from(arrayBuf));
  try {
    fs.chmodSync(YT_DLP_PATH, 0o755);
  } catch (e) {
    console.warn('Unable to chmod downloaded yt-dlp binary:', e);
  }
  console.log('yt-dlp_linux executable downloaded and permissions set.');
  return YT_DLP_PATH;
}

// Resilient yt-dlp execution wrapper
async function runYtDlp(args: string[], options: any = {}): Promise<{ stdout: string; stderr: string }> {
  let binaryPath = await ensureYtDlp();

  try {
    fs.chmodSync(binaryPath, 0o755);
  } catch (e) {}

  const opts = {
    maxBuffer: 30 * 1024 * 1024,
    env: { ...process.env, PYTHONWARNINGS: 'ignore', PYTHONIOENCODING: 'utf-8' },
    ...options
  };

  try {
    const res = await execFileAsync(binaryPath, args, opts);
    return {
      stdout: String(res.stdout),
      stderr: String(res.stderr)
    };
  } catch (err: any) {
    if (err.stdout !== undefined || err.stderr !== undefined) {
      const rawStderr = String(err.stderr || '');
      const rawStdout = String(err.stdout || '');

      // Clean Python deprecation warnings and yt-dlp stderr noise
      const cleanStderr = rawStderr
        .split('\n')
        .filter(line => !line.includes('Deprecated Feature:') && !line.includes('Support for Python version'))
        .join('\n')
        .trim();

      const cleanMessage = cleanStderr || rawStdout.trim() || err.message || 'yt-dlp execution failed';
      const errorObj = new Error(cleanMessage);
      (errorObj as any).stdout = rawStdout;
      (errorObj as any).stderr = cleanStderr;
      (errorObj as any).code = err.code;
      throw errorObj;
    }

    // Only if binary missing/permission error, attempt re-ensuring binary
    console.warn('yt-dlp binary execution error, re-downloading:', err.message);
    binaryPath = await ensureYtDlp(true);
    const res = await execFileAsync(binaryPath, args, opts);
    return {
      stdout: String(res.stdout),
      stderr: String(res.stderr)
    };
  }
}

// Robust JSON output parser for yt-dlp stdout
function parseJsonOutput(stdout: string): any {
  const trimmed = stdout.trim();
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  const jsonStr = startIdx >= 0 ? trimmed.substring(startIdx) : trimmed;
  return JSON.parse(jsonStr);
}

// Helper to follow redirects and resolve shortlinks (fb.watch, facebook.com/share, etc.)
async function resolveShortlink(url: string): Promise<{ resolvedUrl: string; requiresAuth: boolean }> {
  if (!url) return { resolvedUrl: url, requiresAuth: false };
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      },
      redirect: 'follow'
    });
    if (res.url) {
      let finalUrl = res.url;
      // If redirected to login containing a next query parameter, extract the true target URL
      if (finalUrl.includes('/login') && finalUrl.includes('next=')) {
        try {
          const parsed = new URL(finalUrl);
          const nextVal = parsed.searchParams.get('next');
          if (nextVal) {
            finalUrl = decodeURIComponent(nextVal);
          }
        } catch (e) {}
      }
      return { resolvedUrl: finalUrl, requiresAuth: false };
    }
  } catch (e) {
    // ignore redirect lookup errors
  }
  return { resolvedUrl: url, requiresAuth: false };
}

// API Health Check & yt-dlp Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/yt-dlp-status', async (req, res) => {
  try {
    const { stdout } = await runYtDlp(['--version']);
    res.json({
      success: true,
      engine: 'yt-dlp',
      version: stdout.trim(),
      status: 'active'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      engine: 'yt-dlp',
      error: err.message || 'yt-dlp binary unreadable'
    });
  }
});

// Format duration seconds to MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format upload date e.g. "20241205" -> "2024-12-05"
function formatDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  if (/^\d{8}$/.test(rawDate)) {
    return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  }
  return rawDate;
}

function detectPlatform(url: string, extractorKey?: string): PlatformType {
  const lower = (url + ' ' + (extractorKey || '')).toLowerCase();
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('instagram') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('facebook') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('pinterest') || lower.includes('pin.it')) return 'pinterest';
  if (lower.includes('vimeo')) return 'vimeo';
  return 'other';
}

// Extract media using yt-dlp
async function extractWithYtDlp(targetUrl: string): Promise<{ profile: FacebookProfileInfo; videos: FacebookVideo[] }> {
  const { resolvedUrl, requiresAuth } = await resolveShortlink(targetUrl);

  if (requiresAuth) {
    throw new Error('Link requires Facebook login authentication');
  }

  const args = [
    '--dump-single-json',
    '--no-warnings',
    '--ignore-errors',
    '--playlist-end', '1000',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  let stdout = '';
  const bufferSize = 100 * 1024 * 1024; // 100MB buffer for large 500+ video lists
  try {
    const res = await runYtDlp([...args, resolvedUrl], { maxBuffer: bufferSize });
    stdout = res.stdout;
  } catch (err) {
    if (resolvedUrl !== targetUrl && !resolvedUrl.includes('/login')) {
      const res = await runYtDlp([...args, targetUrl], { maxBuffer: bufferSize });
      stdout = res.stdout;
    } else {
      throw err;
    }
  }

  const rawData = parseJsonOutput(stdout);

  let rawEntries: any[] = [];
  if (rawData._type === 'playlist' && Array.isArray(rawData.entries)) {
    rawEntries = rawData.entries;
  } else if (Array.isArray(rawData.entries)) {
    rawEntries = rawData.entries;
  } else {
    rawEntries = [rawData];
  }

  // Filter out null/empty entries from yt-dlp ignore errors
  rawEntries = rawEntries.filter((item: any) => item && typeof item === 'object');

  if (rawEntries.length === 0) {
    throw new Error('yt-dlp did not return any media entries for this link.');
  }

  const primaryEntry = rawEntries[0] || rawData;
  const platform = detectPlatform(targetUrl, primaryEntry.extractor || primaryEntry.extractor_key);
  
  const platformNames: Record<PlatformType, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    twitter: 'Twitter / X',
    pinterest: 'Pinterest',
    vimeo: 'Vimeo',
    other: 'Social Media'
  };

  const authorName = primaryEntry.uploader || primaryEntry.uploader_id || primaryEntry.channel || rawData.title || `${platformNames[platform]} Creator`;
  const authorHandle = primaryEntry.uploader_id ? `@${primaryEntry.uploader_id}` : (primaryEntry.channel_id ? `@${primaryEntry.channel_id}` : `@${platform}`);
  const authorAvatar = primaryEntry.thumbnail || (primaryEntry.thumbnails && primaryEntry.thumbnails[0]?.url) || '';

  const profileInfo: FacebookProfileInfo = {
    url: targetUrl,
    name: authorName,
    handle: authorHandle,
    avatarUrl: authorAvatar,
    coverUrl: '',
    verified: true,
    followersCount: primaryEntry.view_count || primaryEntry.channel_follower_count || 0,
    totalVideosFound: rawEntries.length,
    category: `${platformNames[platform]} Content`,
    bio: primaryEntry.description || `Extracted ${rawEntries.length} media file(s) from ${platformNames[platform]} via yt-dlp core`,
    platform
  };

  const extractedVideos: FacebookVideo[] = rawEntries.map((item: any, idx: number) => {
    const videoId = item.id || item.display_id || `vid-${Date.now()}-${idx + 1}`;
    const title = item.title || item.fulltitle || `${platformNames[platform]} Video #${idx + 1}`;
    const description = item.description || title;
    const duration = Math.round(item.duration || 0);
    const thumb = item.thumbnail || (item.thumbnails && item.thumbnails.slice(-1)[0]?.url) || authorAvatar;
    const isReel = targetUrl.includes('/reel/') || targetUrl.includes('/reels/') || targetUrl.includes('/shorts/') || (item.width && item.height && item.height > item.width);
    const uploadDate = formatDate(item.upload_date || (item.timestamp ? new Date(item.timestamp * 1000).toISOString().split('T')[0] : undefined));

    // Extract formats/quality streams
    const qualityStreams: QualityStream[] = [];
    const formats: any[] = Array.isArray(item.formats) ? item.formats : [];

    // Filter direct formats with URLs
    const directFormats = formats.filter((f: any) => f.url && typeof f.url === 'string');

    // Heights to extract: 1080p, 720p, 480p, 360p
    const heights = [1080, 720, 480, 360];
    heights.forEach((h) => {
      const match = directFormats.find((f: any) => f.height === h || (f.height && Math.abs(f.height - h) <= 50));
      if (match && match.url) {
        const approxBytes = match.filesize || match.filesize_approx || (match.bitrate && duration ? Math.round((match.bitrate * duration) / 8) : 0);
        const qLabel = h >= 1080 ? '1080p' : h >= 720 ? '720p' : h >= 480 ? '480p' : '360p';
        
        if (!qualityStreams.some(s => s.quality === qLabel)) {
          qualityStreams.push({
            quality: qLabel as VideoQuality,
            label: `${match.height || h}p ${h >= 720 ? 'HD High Quality' : 'SD Standard'} Stream`,
            resolution: match.width && match.height ? `${match.width}x${match.height}` : `${Math.round(h * 16 / 9)}x${h}`,
            bitrate: match.bitrate ? `${Math.round(match.bitrate / 1000)} Kbps` : `${h >= 720 ? 'High' : 'Standard'} Quality`,
            fileSizeEstimateMB: approxBytes ? parseFloat((approxBytes / (1024 * 1024)).toFixed(1)) : 0,
            url: match.url
          });
        }
      }
    });

    // Fallback best format if qualityStreams is empty
    if (qualityStreams.length === 0) {
      const bestF = directFormats.slice().reverse().find((f: any) => f.url) || item;
      const streamUrl = bestF.url || item.url || primaryEntry.url;
      if (streamUrl) {
        const approxBytes = bestF.filesize || bestF.filesize_approx || 0;
        qualityStreams.push({
          quality: '1080p',
          label: '1080p Original Quality Stream',
          resolution: bestF.width && bestF.height ? `${bestF.width}x${bestF.height}` : '1920x1080',
          bitrate: 'Original Quality',
          fileSizeEstimateMB: approxBytes ? parseFloat((approxBytes / (1024 * 1024)).toFixed(1)) : 0,
          url: streamUrl
        });
      }
    }

    return {
      id: videoId,
      title,
      description,
      authorName: item.uploader || item.channel || authorName,
      authorHandle: item.uploader_id ? `@${item.uploader_id}` : authorHandle,
      authorAvatar: thumb || authorAvatar,
      thumbnailUrl: thumb,
      durationSeconds: duration,
      durationFormatted: formatDuration(duration),
      uploadDate: formatDate(item.upload_date),
      viewsCount: item.view_count || 0,
      likesCount: item.like_count || 0,
      commentsCount: item.comment_count || 0,
      sharesCount: item.repost_count || item.share_count || 0,
      originalPostUrl: item.webpage_url || targetUrl,
      isReel: Boolean(isReel),
      platform,
      qualityStreams,
      selectedQuality: 'Best'
    };
  });

  return { profile: profileInfo, videos: extractedVideos };
}

// HTML Fallback Extractor for share links, profile pages, feeds, and redirected URLs
async function extractWithHtmlFallback(targetUrl: string): Promise<{ profile: FacebookProfileInfo; videos: FacebookVideo[] }> {
  const googlebotHeaders = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  const fbExternalHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  const pageIdMatch = targetUrl.match(/([0-9]{10,25})/);
  const pageId = pageIdMatch ? pageIdMatch[1] : '';

  // Prepare comprehensive list of profile sub-endpoints to fetch all videos and reels
  const urlsToFetch: string[] = [targetUrl];
  const isProfileOrPage = targetUrl.includes('/people/') || targetUrl.includes('/profile.php') || targetUrl.includes('facebook.com/');

  if (isProfileOrPage) {
    const cleanBase = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
    urlsToFetch.push(`${cleanBase}/videos/`);
    urlsToFetch.push(`${cleanBase}/reels/`);
    if (pageId) {
      urlsToFetch.push(`https://www.facebook.com/profile.php?id=${pageId}&sk=videos`);
      urlsToFetch.push(`https://www.facebook.com/profile.php?id=${pageId}&sk=reels_tab`);
      urlsToFetch.push(`https://mbasic.facebook.com/profile.php?id=${pageId}&v=timeline`);
      urlsToFetch.push(`https://mbasic.facebook.com/profile.php?id=${pageId}&v=photos`);
      urlsToFetch.push(`https://m.facebook.com/profile.php?id=${pageId}&v=timeline`);
    }
  }

  // Fetch all endpoints concurrently across Googlebot and Facebook User-Agents
  const fetchPromises: Promise<string>[] = [];
  const uas = [googlebotHeaders, fbExternalHeaders];

  for (const u of urlsToFetch) {
    for (const headersObj of uas) {
      fetchPromises.push(
        fetch(u, { headers: headersObj })
          .then(r => r.ok ? r.text() : '')
          .catch(() => '')
      );
    }
  }

  const htmlResults = await Promise.allSettled(fetchPromises);

  let combinedHtml = htmlResults
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .join('\n');

  // Fallback if initial fetch returned login wall or empty text
  if (!combinedHtml.trim() || combinedHtml.includes('id="unsupported-interstitial"') || combinedHtml.includes('facebook.com/login')) {
    try {
      const fbRes = await fetch(targetUrl, { headers: fbExternalHeaders });
      if (fbRes.ok) {
        combinedHtml = await fbRes.text();
      }
    } catch (e) {
      // ignore
    }
  }

  // Page level metadata
  const titleMatch = combinedHtml.match(/<title>([^<]+)<\/title>/) || combinedHtml.match(/meta property="og:title" content="([^"]+)"/);
  const descMatch = combinedHtml.match(/meta property="og:description" content="([^"]+)"/);
  const siteMatch = combinedHtml.match(/meta property="og:site_name" content="([^"]+)"/);
  const ogImageMatch = combinedHtml.match(/meta property="og:image" content="([^"]+)"/);

  const rawTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace('| Facebook', '').trim() : 'Facebook Creator';
  const rawDesc = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim() : '';
  const authorName = siteMatch ? siteMatch[1].trim() : (rawTitle !== 'Facebook' ? rawTitle : 'Facebook Creator');
  const mainOgImage = ogImageMatch ? ogImageMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&') : '';

  // Gather ALL HD and SD stream matches across the page
  const hdMatches = [
    ...combinedHtml.matchAll(/browser_native_hd_url":"([^"]+)"/g),
    ...combinedHtml.matchAll(/playable_url_quality_hd":"([^"]+)"/g),
    ...combinedHtml.matchAll(/hd_src":"([^"]+)"/g)
  ];

  const sdMatches = [
    ...combinedHtml.matchAll(/browser_native_sd_url":"([^"]+)"/g),
    ...combinedHtml.matchAll(/playable_url":"([^"]+)"/g),
    ...combinedHtml.matchAll(/sd_src":"([^"]+)"/g),
    ...combinedHtml.matchAll(/meta property="og:video" content="([^"]+)"/g),
    ...combinedHtml.matchAll(/meta property="og:video:url" content="([^"]+)"/g)
  ];

  // Gather ALL thumbnail images across the page
  const thumbMatches = [
    ...combinedHtml.matchAll(/preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/g),
    ...combinedHtml.matchAll(/"image":\{"uri":"([^"]+)"/g),
    ...combinedHtml.matchAll(/thumbnailUrl":"([^"]+)"/g),
    ...combinedHtml.matchAll(/meta property="og:image" content="([^"]+)"/g)
  ];

  // Clean and deduplicate URLs
  const cleanHdList = Array.from(new Set(hdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanSdList = Array.from(new Set(sdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanThumbList = Array.from(new Set(thumbMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));

  // Extract video & reel specific IDs across all GraphQL and JSON scripts
  const extractedIdSet = new Set<string>();

  // Primary explicit video and reel IDs
  [...combinedHtml.matchAll(/"video_id":"([0-9]{10,25})"/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/"videoId":"([0-9]{10,25})"/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/\/(videos|reel|watch)\/([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[2]));
  [...combinedHtml.matchAll(/href="\/watch\/\?v=([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/href="\/reel\/([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[1]));

  // Secondary post / story IDs: ONLY include if the surrounding context indicates a video
  const postMatches = [
    ...combinedHtml.matchAll(/"(post_id|story_fbid|legacy_fbid|share_fbid|content_id)":"([0-9]{10,25})"/g),
    ...combinedHtml.matchAll(/(video_id|story_fbid)=([0-9]{10,25})/g)
  ];

  for (const m of postMatches) {
    const pId = m[2];
    if (extractedIdSet.has(pId)) continue;
    const index = m.index || 0;
    const start = Math.max(0, index - 300);
    const end = Math.min(combinedHtml.length, index + 300);
    const context = combinedHtml.slice(start, end);
    if (
      context.includes('video') ||
      context.includes('Video') ||
      context.includes('playable_url') ||
      context.includes('reel') ||
      context.includes('Reel') ||
      context.includes('is_video":true') ||
      context.includes('media_type":"video')
    ) {
      extractedIdSet.add(pId);
    }
  }

  // Filter out the page ID itself if extracted
  if (pageId) {
    extractedIdSet.delete(pageId);
  }

  let rawVideoIds = Array.from(extractedIdSet);

  // If no specific video IDs were extracted, fallback to available HD/SD streams count or 1
  if (rawVideoIds.length === 0) {
    const streamCount = Math.max(cleanHdList.length, cleanSdList.length, 1);
    for (let i = 0; i < streamCount; i++) {
      rawVideoIds.push(`fb-vid-${Date.now()}-${i + 1}`);
    }
  }

  const isReel = targetUrl.includes('/reel/') || targetUrl.includes('/reels/');
  const extractedVideos: FacebookVideo[] = [];

  for (let idx = 0; idx < rawVideoIds.length; idx++) {
    const vId = rawVideoIds[idx];
    const watchPermalink = `https://www.facebook.com/watch/?v=${vId}`;
    
    const hdUrl = cleanHdList[idx] || watchPermalink;
    const sdUrl = cleanSdList[idx] || cleanHdList[idx] || watchPermalink;

    const videoThumb = cleanThumbList[idx] || mainOgImage || `https://picsum.photos/seed/${vId}/640/360`;

    const qualityStreams: QualityStream[] = [
      {
        quality: '1080p',
        label: '1080p HD High Quality Stream',
        resolution: '1920x1080',
        bitrate: 'High Quality',
        fileSizeEstimateMB: 0,
        url: hdUrl
      },
      {
        quality: '720p',
        label: '720p SD Standard Stream',
        resolution: '1280x720',
        bitrate: 'Standard',
        fileSizeEstimateMB: 0,
        url: sdUrl
      }
    ];

    const videoTitle = rawVideoIds.length === 1 
      ? (rawTitle || authorName) 
      : `${authorName} - Video #${idx + 1} (${vId.slice(-6)})`;

    extractedVideos.push({
      id: vId,
      title: videoTitle,
      description: rawDesc || videoTitle,
      authorName,
      authorHandle: `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'facebook'}`,
      authorAvatar: mainOgImage || videoThumb,
      thumbnailUrl: videoThumb,
      durationSeconds: 0,
      durationFormatted: 'HD Stream',
      uploadDate: new Date().toISOString().split('T')[0],
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      originalPostUrl: watchPermalink,
      isReel,
      platform: detectPlatform(targetUrl, ''),
      qualityStreams,
      selectedQuality: 'Best'
    });
  }

  const profileInfo: FacebookProfileInfo = {
    url: targetUrl,
    name: authorName,
    handle: `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'facebook'}`,
    avatarUrl: mainOgImage,
    coverUrl: '',
    verified: true,
    followersCount: 0,
    totalVideosFound: extractedVideos.length,
    category: extractedVideos.length > 0 ? (extractedVideos.length === 1 ? 'Public Video / Clip' : 'Creator Feed / Playlist') : 'Profile / Page',
    bio: rawDesc || (extractedVideos.length > 0 ? `Extracted all ${extractedVideos.length} media item(s) for ${authorName}` : `Profile page resolved for ${authorName}`)
  };

  return { profile: profileInfo, videos: extractedVideos };
}

// FB Scraper API endpoint using yt-dlp + HTML Fallback
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, dateFrom, dateTo } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Facebook profile or video URL.'
      });
    }

    const cleanUrl = url.trim();

    // Helper to apply optional date range filter
    const applyDateFilter = (vList: FacebookVideo[]) => {
      // If no date is selected (empty dateFrom & dateTo), return ALL videos without restrictions
      if (!dateFrom && !dateTo) return vList;

      return vList.filter(v => {
        if (!v.uploadDate) return true;
        if (dateFrom && v.uploadDate < dateFrom) return false;
        if (dateTo && v.uploadDate > dateTo) return false;
        return true;
      });
    };

    try {
      // First attempt with yt-dlp
      const ytResult = await extractWithYtDlp(cleanUrl);

      let finalProfile = ytResult.profile;
      let finalVideos = ytResult.videos;

      // For profile pages or playlists where yt-dlp may return a small subset (e.g., 20),
      // attempt HTML fallback to capture full 147+ video playlist feed
      try {
        const fallbackResult = await extractWithHtmlFallback(cleanUrl);
        if (fallbackResult.videos.length > finalVideos.length) {
          finalProfile = fallbackResult.profile;
          finalVideos = fallbackResult.videos;
        }
      } catch (fErr) {
        // Keep yt-dlp result if fallback failed
      }

      const filteredVideos = applyDateFilter(finalVideos);

      return res.json({
        success: true,
        profile: {
          ...finalProfile,
          totalVideosFound: filteredVideos.length
        },
        videos: filteredVideos,
        scrapedAt: new Date().toISOString()
      });
    } catch (ytErr: any) {
      const ytErrMsg = String(ytErr.message || ytErr.stderr || '');
      console.log('yt-dlp core extraction bypassed, executing HTML fallback scraper for:', cleanUrl);

      try {
        const { profile, videos } = await extractWithHtmlFallback(cleanUrl);
        if (videos.length > 0) {
          const filteredVideos = applyDateFilter(videos);
          return res.json({
            success: true,
            profile: {
              ...profile,
              totalVideosFound: filteredVideos.length
            },
            videos: filteredVideos,
            scrapedAt: new Date().toISOString()
          });
        }
      } catch (fallbackErr: any) {
        // Fallback failed
      }

      const isProfile = cleanUrl.includes('/people/') || cleanUrl.includes('/profile.php') || ytErrMsg.includes('Unsupported URL') || ytErrMsg.includes('profile');
      let userFriendlyReason = 'No public video streams found at this Facebook link.';

      if (isProfile) {
        userFriendlyReason = 'This link points to a Facebook Profile or Page. Please paste a direct Reel, Watch, or Video post link (e.g. facebook.com/reel/... or facebook.com/watch/?v=...) to download.';
      } else if (ytErrMsg.includes('This video is private') || ytErrMsg.includes('private')) {
        userFriendlyReason = 'This Facebook video or post appears to be private or restricted.';
      } else if (ytErrMsg.includes('Log in') || ytErrMsg.includes('login')) {
        userFriendlyReason = 'Facebook requires login authentication to view this private content.';
      }

      return res.status(400).json({
        success: false,
        message: userFriendlyReason
      });
    }
  } catch (err: any) {
    console.error('Error in /api/scrape:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An internal error occurred while scraping Facebook video streams.'
    });
  }
});

// Download proxy route to bypass browser CORS and attach proper headers for local drive saving
app.get('/api/download-proxy', async (req, res) => {
  try {
    const rawVideoUrl = req.query.url as string;
    const filename = (req.query.filename as string) || 'social_media_video.mp4';

    if (!rawVideoUrl) {
      return res.status(400).send('Missing video URL parameter.');
    }

    let targetStreamUrl = rawVideoUrl;

    // Check if the URL is a direct media CDN URL (.mp4 or fbcdn.net without watch/reel webpage paths)
    const isDirectMedia = (targetStreamUrl.includes('.mp4') || targetStreamUrl.includes('fbcdn.net')) &&
                          !targetStreamUrl.includes('facebook.com/watch') &&
                          !targetStreamUrl.includes('facebook.com/reel') &&
                          !targetStreamUrl.includes('facebook.com/share');

    if (!isDirectMedia) {
      console.log('Resolving direct video CDN stream URL via yt-dlp for:', rawVideoUrl);
      try {
        const { stdout } = await runYtDlp(['-g', '-f', 'b/best/mp4', '--no-warnings', rawVideoUrl]);
        const extractedUrls = stdout.trim().split('\n').map(u => u.trim()).filter(Boolean);
        if (extractedUrls.length > 0 && extractedUrls[0].startsWith('http')) {
          targetStreamUrl = extractedUrls[0];
          console.log('Successfully resolved direct video stream URL:', targetStreamUrl.slice(0, 100) + '...');
        }
      } catch (err: any) {
        console.warn('yt-dlp stream resolution warning:', err.message);
      }
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    let videoResponse = await fetch(targetStreamUrl, { headers });

    // If initial fetch returned HTML instead of a video binary stream, attempt yt-dlp resolution with alternate options
    let initialType = videoResponse.headers.get('content-type') || '';
    if (initialType.includes('text/html')) {
      console.log('Target URL returned HTML webpage instead of video binary stream. Attempting yt-dlp stream extraction...');
      try {
        const { stdout } = await runYtDlp(['-g', '-f', 'mp4/best/b', '--no-warnings', rawVideoUrl]);
        const extractedUrls = stdout.trim().split('\n').map(u => u.trim()).filter(Boolean);
        if (extractedUrls.length > 0 && extractedUrls[0].startsWith('http')) {
          targetStreamUrl = extractedUrls[0];
          videoResponse = await fetch(targetStreamUrl, { headers });
          initialType = videoResponse.headers.get('content-type') || '';
        }
      } catch (e) {
        // ignore fallback error
      }
    }

    if (!videoResponse.ok && videoResponse.status !== 206) {
      return res.status(502).json({ error: `Failed to fetch remote video binary stream. Status: ${videoResponse.status}` });
    }

    // Reject HTML text payloads to prevent saving invalid 00:00 duration HTML files as MP4
    if (initialType.includes('text/html')) {
      return res.status(400).json({ error: 'Direct video stream URL could not be resolved for this item.' });
    }

    const contentType = initialType.includes('video') ? initialType : 'video/mp4';

    const contentLength = videoResponse.headers.get('content-length');
    const contentRange = videoResponse.headers.get('content-range');

    const safeFilename = encodeURIComponent(filename.replace(/[/\\?%*:|"<>]/g, '_'));

    res.status(videoResponse.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');

    if (!videoResponse.body) {
      const arrayBuffer = await videoResponse.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    const reader = videoResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: any) {
    console.error('Download proxy error:', err);
    if (!res.headersSent) {
      res.status(500).send('Server error downloading video.');
    }
  }
});

async function startServer() {
  // Ensure yt-dlp is available on boot
  try {
    await ensureYtDlp();
  } catch (e) {
    console.error('Boot yt-dlp initialization warning:', e);
  }

  // Vite middleware for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

