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
  const oldPath = path.join(process.cwd(), 'yt-dlp');
  if (fs.existsSync(oldPath)) {
    try { fs.unlinkSync(oldPath); } catch (e) {}
  }

  if (!forceRedownload && fs.existsSync(YT_DLP_PATH)) {
    try {
      fs.chmodSync(YT_DLP_PATH, 0o755);
    } catch (e) {}
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
    maxBuffer: 100 * 1024 * 1024,
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

// Helper to follow redirects and resolve shortlinks
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
  } catch (e) {}
  return { resolvedUrl: url, requiresAuth: false };
}

// API Health Check
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

// Format duration seconds
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

// Generate candidate sub-URLs for profile / channel scraping across platforms
function generateCandidateUrls(url: string): string[] {
  const clean = url.trim();
  const lower = clean.toLowerCase();
  const candidateUrls: string[] = [clean];

  // Instagram profile
  if (lower.includes('instagram.com/')) {
    const match = clean.match(/instagram\.com\/([a-zA-Z0-9_.]+)\/?$/);
    if (match && match[1] && !['reel', 'reels', 'p', 'stories', 'explore', 'direct'].includes(match[1])) {
      const username = match[1];
      candidateUrls.unshift(`https://www.instagram.com/${username}/reels/`);
      candidateUrls.push(`https://www.instagram.com/${username}/`);
    }
  }

  // YouTube channel / user
  if (lower.includes('youtube.com/')) {
    if (clean.includes('/@') && !clean.includes('/videos') && !clean.includes('/shorts') && !clean.includes('/playlists')) {
      const base = clean.endsWith('/') ? clean.slice(0, -1) : clean;
      candidateUrls.unshift(`${base}/videos`);
      candidateUrls.push(`${base}/shorts`);
    }
  }

  // Facebook profile / page
  if (lower.includes('facebook.com/')) {
    if (!clean.includes('/watch') && !clean.includes('/reel') && !clean.includes('/videos') && !clean.includes('/reels')) {
      const base = clean.endsWith('/') ? clean.slice(0, -1) : clean;
      candidateUrls.unshift(`${base}/videos/`);
      candidateUrls.push(`${base}/reels/`);
    }
  }

  // Twitter / X profile
  if (lower.includes('x.com/') || lower.includes('twitter.com/')) {
    const match = clean.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)\/?$/);
    if (match && match[1] && !['status', 'i', 'home', 'explore', 'notifications'].includes(match[1])) {
      const username = match[1];
      candidateUrls.unshift(`https://x.com/${username}/media`);
    }
  }

  return Array.from(new Set(candidateUrls));
}

// Extract media using yt-dlp
async function extractWithYtDlp(targetUrl: string): Promise<{ profile: FacebookProfileInfo; videos: FacebookVideo[] }> {
  const candidates = generateCandidateUrls(targetUrl);
  let lastError: any = null;

  for (const candidateUrl of candidates) {
    const { resolvedUrl } = await resolveShortlink(candidateUrl);

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--ignore-errors',
      '--playlist-end', '50',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    let stdout = '';
    const bufferSize = 100 * 1024 * 1024;
    try {
      const res = await runYtDlp([...args, resolvedUrl], { maxBuffer: bufferSize });
      stdout = res.stdout;
    } catch (err) {
      if (resolvedUrl !== candidateUrl) {
        try {
          const res = await runYtDlp([...args, candidateUrl], { maxBuffer: bufferSize });
          stdout = res.stdout;
        } catch (e2) {
          lastError = e2;
          continue;
        }
      } else {
        lastError = err;
        continue;
      }
    }

    let rawData: any;
    try {
      rawData = parseJsonOutput(stdout);
    } catch (parseErr) {
      lastError = parseErr;
      continue;
    }

    if (!rawData) continue;

    let rawEntries: any[] = [];
    if (rawData._type === 'playlist' && Array.isArray(rawData.entries)) {
      rawEntries = rawData.entries;
    } else if (Array.isArray(rawData.entries)) {
      rawEntries = rawData.entries;
    } else {
      rawEntries = [rawData];
    }

    rawEntries = rawEntries.filter((item: any) => item && typeof item === 'object');

    if (rawEntries.length === 0) continue;

    const primaryEntry = rawEntries[0] || rawData;
    const platform = detectPlatform(targetUrl, primaryEntry.extractor || primaryEntry.extractor_key || rawData.extractor || rawData.extractor_key);
    
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

    const authorName = primaryEntry.uploader || primaryEntry.uploader_id || primaryEntry.channel || rawData.uploader || rawData.channel || rawData.title || `${platformNames[platform]} Creator`;
    const authorHandle = primaryEntry.uploader_id ? `@${primaryEntry.uploader_id}` : (primaryEntry.channel_id ? `@${primaryEntry.channel_id}` : `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`);
    const authorAvatar = primaryEntry.thumbnail || (primaryEntry.thumbnails && primaryEntry.thumbnails[0]?.url) || rawData.thumbnail || '';

    const profileInfo: FacebookProfileInfo = {
      url: targetUrl,
      name: authorName,
      handle: authorHandle,
      avatarUrl: authorAvatar,
      coverUrl: '',
      verified: true,
      followersCount: primaryEntry.view_count || primaryEntry.channel_follower_count || rawData.view_count || 0,
      totalVideosFound: rawEntries.length,
      category: `${platformNames[platform]} Profile / Channel`,
      bio: primaryEntry.description || rawData.description || `Extracted ${rawEntries.length} media file(s) from ${platformNames[platform]} creator channel/profile`,
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

      const webpageUrl = item.webpage_url || item.url || (platform === 'youtube' ? `https://www.youtube.com/watch?v=${videoId}` : (platform === 'instagram' ? `https://www.instagram.com/reel/${videoId}/` : (platform === 'tiktok' ? `https://www.tiktok.com/video/${videoId}` : (platform === 'facebook' ? `https://www.facebook.com/watch/?v=${videoId}` : targetUrl))));

      // Extract formats/quality streams
      const qualityStreams: QualityStream[] = [];
      const formats: any[] = Array.isArray(item.formats) ? item.formats : [];
      const directFormats = formats.filter((f: any) => f.url && typeof f.url === 'string');

      const heights = [2160, 1440, 1080, 720, 480, 360];
      heights.forEach((h) => {
        const match = directFormats.find((f: any) => f.height === h || (f.height && Math.abs(f.height - h) <= 50));
        if (match && match.url) {
          const approxBytes = match.filesize || match.filesize_approx || (match.bitrate && duration ? Math.round((match.bitrate * duration) / 8) : 0);
          const qLabel = h >= 2160 ? '2160p' : h >= 1440 ? '1440p' : h >= 1080 ? '1080p' : h >= 720 ? '720p' : h >= 480 ? '480p' : '360p';
          
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

      // Fallback stream options if qualityStreams is empty
      if (qualityStreams.length === 0) {
        const bestF = directFormats.slice().reverse().find((f: any) => f.url) || item;
        let streamUrl = bestF.url || item.url || webpageUrl;
        
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '_');
        const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(webpageUrl || streamUrl)}&filename=${encodeURIComponent(safeTitle)}.mp4`;

        qualityStreams.push({
          quality: '1080p',
          label: '1080p FHD High Quality Stream',
          resolution: item.width && item.height ? `${item.width}x${item.height}` : '1920x1080',
          bitrate: 'High Quality',
          fileSizeEstimateMB: 0,
          url: (streamUrl && streamUrl.startsWith('http') && streamUrl.includes('.mp4')) ? streamUrl : proxyUrl
        });

        qualityStreams.push({
          quality: '720p',
          label: '720p HD Standard Stream',
          resolution: '1280x720',
          bitrate: 'Standard',
          fileSizeEstimateMB: 0,
          url: (streamUrl && streamUrl.startsWith('http') && streamUrl.includes('.mp4')) ? streamUrl : proxyUrl
        });

        qualityStreams.push({
          quality: '480p',
          label: '480p SD Mobile Stream',
          resolution: '854x480',
          bitrate: 'Mobile',
          fileSizeEstimateMB: 0,
          url: (streamUrl && streamUrl.startsWith('http') && streamUrl.includes('.mp4')) ? streamUrl : proxyUrl
        });
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
        originalPostUrl: webpageUrl,
        isReel: Boolean(isReel),
        platform,
        qualityStreams,
        selectedQuality: 'Best'
      };
    });

    return { profile: profileInfo, videos: extractedVideos };
  }

  if (lastError) throw lastError;
  throw new Error('yt-dlp could not extract media entries from this URL.');
}

// HTML Fallback Extractor for Facebook profile pages, reels, and feeds
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

  const urlsToFetch: string[] = [targetUrl];
  const isProfileOrPage = targetUrl.includes('/people/') || targetUrl.includes('/profile.php') || targetUrl.includes('facebook.com/');

  if (isProfileOrPage) {
    const cleanBase = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
    urlsToFetch.push(`${cleanBase}/videos/`);
    urlsToFetch.push(`${cleanBase}/reels/`);
    if (pageId) {
      urlsToFetch.push(`https://www.facebook.com/profile.php?id=${pageId}&sk=videos`);
      urlsToFetch.push(`https://www.facebook.com/profile.php?id=${pageId}&sk=reels_tab`);
    }
  }

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

  if (!combinedHtml.trim() || combinedHtml.includes('id="unsupported-interstitial"') || combinedHtml.includes('facebook.com/login')) {
    try {
      const fbRes = await fetch(targetUrl, { headers: fbExternalHeaders });
      if (fbRes.ok) {
        combinedHtml = await fbRes.text();
      }
    } catch (e) {}
  }

  const titleMatch = combinedHtml.match(/<title>([^<]+)<\/title>/) || combinedHtml.match(/meta property="og:title" content="([^"]+)"/);
  const descMatch = combinedHtml.match(/meta property="og:description" content="([^"]+)"/);
  const siteMatch = combinedHtml.match(/meta property="og:site_name" content="([^"]+)"/);
  const ogImageMatch = combinedHtml.match(/meta property="og:image" content="([^"]+)"/);

  const rawTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace('| Facebook', '').trim() : 'Facebook Creator';
  const rawDesc = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim() : '';
  const authorName = siteMatch ? siteMatch[1].trim() : (rawTitle !== 'Facebook' ? rawTitle : 'Facebook Creator');
  const mainOgImage = ogImageMatch ? ogImageMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&') : '';

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

  const thumbMatches = [
    ...combinedHtml.matchAll(/preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/g),
    ...combinedHtml.matchAll(/"image":\{"uri":"([^"]+)"/g),
    ...combinedHtml.matchAll(/thumbnailUrl":"([^"]+)"/g),
    ...combinedHtml.matchAll(/meta property="og:image" content="([^"]+)"/g)
  ];

  const cleanHdList = Array.from(new Set(hdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanSdList = Array.from(new Set(sdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanThumbList = Array.from(new Set(thumbMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));

  const extractedIdSet = new Set<string>();

  [...combinedHtml.matchAll(/"video_id":"([0-9]{10,25})"/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/"videoId":"([0-9]{10,25})"/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/\/(videos|reel|watch)\/([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[2]));
  [...combinedHtml.matchAll(/href="\/watch\/\?v=([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[1]));
  [...combinedHtml.matchAll(/href="\/reel\/([0-9]{10,25})/g)].forEach(m => extractedIdSet.add(m[1]));

  if (pageId) {
    extractedIdSet.delete(pageId);
  }

  let rawVideoIds = Array.from(extractedIdSet);
  const isReel = targetUrl.includes('/reel/') || targetUrl.includes('/reels/');
  const extractedVideos: FacebookVideo[] = [];

  for (let idx = 0; idx < rawVideoIds.length; idx++) {
    const vId = rawVideoIds[idx];
    const watchPermalink = `https://www.facebook.com/watch/?v=${vId}`;
    
    const hdCandidate = cleanHdList[idx] || '';
    const sdCandidate = cleanSdList[idx] || cleanHdList[idx] || '';

    const isValidStream = (u: string) => u && typeof u === 'string' && (u.includes('.mp4') || u.includes('fbcdn.net') || u.includes('playable_url'));

    const hdUrl = isValidStream(hdCandidate) ? hdCandidate : (isValidStream(sdCandidate) ? sdCandidate : '');
    const sdUrl = isValidStream(sdCandidate) ? sdCandidate : hdUrl;

    const videoTitle = rawVideoIds.length === 1 
      ? (rawTitle || authorName) 
      : `${authorName} - Reel / Post (${vId.slice(-6)})`;

    const videoThumb = cleanThumbList[idx] || mainOgImage || '';
    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(watchPermalink)}&filename=${encodeURIComponent(videoTitle.replace(/[/\\?%*:|"<>]/g, '_'))}.mp4`;

    const qualityStreams: QualityStream[] = [];
    qualityStreams.push({
      quality: '1080p',
      label: '1080p HD Stream',
      resolution: '1920x1080',
      bitrate: 'High Quality',
      fileSizeEstimateMB: 0,
      url: hdUrl || proxyUrl
    });

    if (sdUrl && sdUrl !== hdUrl) {
      qualityStreams.push({
        quality: '720p',
        label: '720p SD Stream',
        resolution: '1280x720',
        bitrate: 'Standard',
        fileSizeEstimateMB: 0,
        url: sdUrl
      });
    }

    extractedVideos.push({
      id: vId,
      title: videoTitle,
      description: rawDesc || videoTitle,
      authorName,
      authorHandle: `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'facebook'}`,
      authorAvatar: mainOgImage || videoThumb || '',
      thumbnailUrl: videoThumb || mainOgImage || '',
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

// Scrape API handler logic shared by /api/scrape and /api/extract
async function handleScrapeOrExtract(req: express.Request, res: express.Response) {
  try {
    const { url, dateFrom, dateTo } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid URL.',
        errorType: 'INVALID_URL',
        errorDetails: 'Provided URL string was empty or invalid type.',
        suggestions: [
          'Paste a profile, channel, reel, video, or playlist URL',
          'Make sure the URL starts with http:// or https://'
        ]
      });
    }

    let cleanUrl = url.trim();

    // Automatically resolve Facebook share URLs (/share/) to their target canonical URL
    if (cleanUrl.includes('/share/')) {
      try {
        const resRedirect = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          redirect: 'follow'
        });
        if (resRedirect.url && resRedirect.url !== cleanUrl) {
          console.log(`Resolved share link ${cleanUrl} -> ${resRedirect.url}`);
          cleanUrl = resRedirect.url;
        }
      } catch (rErr) {}
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link format. Please include http:// or https://',
        errorType: 'INVALID_URL',
        errorDetails: `URL "${cleanUrl}" missing valid HTTP scheme protocol.`,
        suggestions: [
          'Ensure the URL begins with https://',
          'Copy and paste the link directly from your browser'
        ]
      });
    }

    const applyDateFilter = (vList: FacebookVideo[]) => {
      if (!dateFrom && !dateTo) return vList;

      return vList.filter(v => {
        if (!v.uploadDate) return true;
        if (dateFrom && v.uploadDate < dateFrom) return false;
        if (dateTo && v.uploadDate > dateTo) return false;
        return true;
      });
    };

    let finalProfile: FacebookProfileInfo | null = null;
    let finalVideos: FacebookVideo[] = [];

    // Attempt 1: Core yt-dlp extraction with candidate URLs
    try {
      const ytResult = await extractWithYtDlp(cleanUrl);
      if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
        finalProfile = ytResult.profile;
        finalVideos = ytResult.videos;
      } else if (ytResult && ytResult.profile) {
        finalProfile = ytResult.profile;
      }
    } catch (ytErr) {
      console.log('yt-dlp core extraction notice:', (ytErr as any).message || ytErr);
    }

    // Attempt 2: HTML Fallback scraper if yt-dlp yielded 0 videos
    if (finalVideos.length === 0) {
      try {
        const fallbackResult = await extractWithHtmlFallback(cleanUrl);
        if (fallbackResult && fallbackResult.videos && fallbackResult.videos.length > 0) {
          if (!finalProfile || fallbackResult.videos.length > finalVideos.length) {
            finalProfile = fallbackResult.profile;
          }
          finalVideos = fallbackResult.videos;
        } else if (!finalProfile && fallbackResult && fallbackResult.profile) {
          finalProfile = fallbackResult.profile;
        }
      } catch (fbErr) {
        console.log('HTML fallback notice:', (fbErr as any).message || fbErr);
      }
    }

    const filteredVideos = applyDateFilter(finalVideos);
    const platform = detectPlatform(cleanUrl, '');

    if (filteredVideos.length > 0) {
      return res.json({
        success: true,
        platform,
        title: finalProfile?.name || 'Media Gallery',
        profile: finalProfile ? {
          ...finalProfile,
          totalVideosFound: filteredVideos.length
        } : null,
        videos: filteredVideos,
        scrapedAt: new Date().toISOString()
      });
    }

    // If 0 public videos found after both engines
    return res.status(200).json({
      success: true,
      platform,
      title: finalProfile?.name || 'Profile',
      profile: finalProfile || {
        url: cleanUrl,
        name: 'Profile / Creator Page',
        handle: '@creator',
        avatarUrl: '',
        coverUrl: '',
        verified: false,
        followersCount: 0,
        totalVideosFound: 0,
        category: 'Public Profile',
        bio: 'No public video streams found on this profile link.',
        platform
      },
      videos: [],
      scrapedAt: new Date().toISOString(),
      message: 'No public video streams were detected at this link. Please check if the profile has public reels/videos or try pasting a direct video link.'
    });

  } catch (err: any) {
    console.error('Error in scraper handler:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An internal error occurred while scraping video streams.',
      errorType: 'UNKNOWN',
      errorDetails: err.stack || err.message,
      suggestions: [
        'Retry the action in a few moments',
        'Verify your connection and link formatting'
      ]
    });
  }
}

// Register both /api/scrape and /api/extract endpoints
app.post('/api/scrape', handleScrapeOrExtract);
app.post('/api/extract', handleScrapeOrExtract);

// Download proxy route to bypass browser CORS and attach proper headers for local drive saving
app.get('/api/download-proxy', async (req, res) => {
  try {
    const rawVideoUrl = req.query.url as string;
    const filename = (req.query.filename as string) || 'social_media_video.mp4';

    if (!rawVideoUrl) {
      return res.status(400).send('Missing video URL parameter.');
    }

    let targetStreamUrl = rawVideoUrl;

    const isDirectMedia = (targetStreamUrl.includes('.mp4') || targetStreamUrl.includes('fbcdn.net')) &&
                          !targetStreamUrl.includes('facebook.com/watch') &&
                          !targetStreamUrl.includes('facebook.com/reel') &&
                          !targetStreamUrl.includes('youtube.com/') &&
                          !targetStreamUrl.includes('instagram.com/') &&
                          !targetStreamUrl.includes('tiktok.com/');

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
        console.log('yt-dlp stream resolution notice:', (err.message || '').split('\n')[0]);
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
      } catch (e) {}
    }

    if (!videoResponse.ok && videoResponse.status !== 206) {
      return res.status(502).json({ error: `Failed to fetch remote video binary stream. Status: ${videoResponse.status}` });
    }

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
  try {
    await ensureYtDlp();
  } catch (e) {
    console.error('Boot yt-dlp initialization warning:', e);
  }

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
