import express from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';
import { FacebookProfileInfo, FacebookVideo, QualityStream } from './src/types.js';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3000;

app.use(express.json());

const YT_DLP_PATH = path.join(process.cwd(), 'yt-dlp');

// Helper to ensure yt-dlp binary is available
async function ensureYtDlp(): Promise<string> {
  if (fs.existsSync(YT_DLP_PATH)) {
    return YT_DLP_PATH;
  }
  console.log('Downloading yt-dlp executable binary...');
  const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp');
  if (!res.ok) {
    throw new Error(`Failed to download yt-dlp binary: HTTP ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  fs.writeFileSync(YT_DLP_PATH, Buffer.from(arrayBuf));
  fs.chmodSync(YT_DLP_PATH, 0o755);
  console.log('yt-dlp executable downloaded and permissions set.');
  return YT_DLP_PATH;
}

// API Health Check & yt-dlp Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/yt-dlp-status', async (req, res) => {
  try {
    const binaryPath = await ensureYtDlp();
    const { stdout } = await execFileAsync(binaryPath, ['--version']);
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

// Extract media using yt-dlp
async function extractWithYtDlp(targetUrl: string): Promise<{ profile: FacebookProfileInfo; videos: FacebookVideo[] }> {
  const binaryPath = await ensureYtDlp();

  // Execute yt-dlp --dump-single-json --no-warnings --flat-playlist
  const { stdout } = await execFileAsync(binaryPath, [
    '--dump-single-json',
    '--no-warnings',
    '--no-call-home',
    targetUrl
  ], {
    maxBuffer: 20 * 1024 * 1024
  });

  const rawData = JSON.parse(stdout.trim());

  let rawEntries: any[] = [];
  if (rawData._type === 'playlist' && Array.isArray(rawData.entries)) {
    rawEntries = rawData.entries;
  } else if (Array.isArray(rawData.entries)) {
    rawEntries = rawData.entries;
  } else {
    rawEntries = [rawData];
  }

  if (rawEntries.length === 0) {
    throw new Error('yt-dlp did not return any media entries for this link.');
  }

  const primaryEntry = rawEntries[0] || rawData;
  const authorName = primaryEntry.uploader || primaryEntry.uploader_id || rawData.title || 'Facebook Creator';
  const authorHandle = primaryEntry.uploader_id ? `@${primaryEntry.uploader_id}` : '@facebook';
  const authorAvatar = primaryEntry.thumbnail || (primaryEntry.thumbnails && primaryEntry.thumbnails[0]?.url) || '';

  const profileInfo: FacebookProfileInfo = {
    url: targetUrl,
    name: authorName,
    handle: authorHandle,
    avatarUrl: authorAvatar,
    coverUrl: '',
    verified: true,
    followersCount: primaryEntry.view_count || 0,
    totalVideosFound: rawEntries.length,
    category: 'Public Content',
    bio: primaryEntry.description || `Extracted ${rawEntries.length} media file(s) via yt-dlp`
  };

  const extractedVideos: FacebookVideo[] = rawEntries.map((item: any, idx: number) => {
    const videoId = item.id || item.display_id || `fb-video-${Date.now()}-${idx}`;
    const title = item.title || item.fulltitle || 'Facebook Video';
    const description = item.description || title;
    const duration = Math.round(item.duration || 0);
    const thumb = item.thumbnail || (item.thumbnails && item.thumbnails.slice(-1)[0]?.url) || authorAvatar;
    const isReel = targetUrl.includes('/reel/') || targetUrl.includes('/reels/') || (item.width && item.height && item.height > item.width);

    // Extract formats/quality streams
    const qualityStreams: QualityStream[] = [];
    const formats: any[] = Array.isArray(item.formats) ? item.formats : [];

    // Look for HD and SD formats or direct stream
    const hdFormat = formats.find((f: any) => f.format_id === 'hd' || f.quality === -2 || (f.height && f.height >= 720)) || formats[formats.length - 1];
    const sdFormat = formats.find((f: any) => f.format_id === 'sd' || f.quality === -3 || (f.height && f.height < 720)) || formats[0];

    if (hdFormat && hdFormat.url) {
      const approxBytes = hdFormat.filesize || hdFormat.filesize_approx || (hdFormat.bitrate && duration ? Math.round((hdFormat.bitrate * duration) / 8) : 0);
      qualityStreams.push({
        quality: '1080p',
        label: hdFormat.format_id === 'hd' ? '1080p HD High Quality Stream' : `${hdFormat.height || 1080}p High Quality`,
        resolution: hdFormat.width && hdFormat.height ? `${hdFormat.width}x${hdFormat.height}` : '1920x1080',
        bitrate: hdFormat.bitrate ? `${Math.round(hdFormat.bitrate / 1000)} Kbps` : 'High Quality',
        fileSizeEstimateMB: approxBytes ? parseFloat((approxBytes / (1024 * 1024)).toFixed(1)) : 0,
        url: hdFormat.url
      });
    }

    if (sdFormat && sdFormat.url && sdFormat.url !== hdFormat?.url) {
      const approxBytes = sdFormat.filesize || sdFormat.filesize_approx || (sdFormat.bitrate && duration ? Math.round((sdFormat.bitrate * duration) / 8) : 0);
      qualityStreams.push({
        quality: '720p',
        label: sdFormat.format_id === 'sd' ? '720p SD Standard Stream' : `${sdFormat.height || 720}p Standard Quality`,
        resolution: sdFormat.width && sdFormat.height ? `${sdFormat.width}x${sdFormat.height}` : '1280x720',
        bitrate: sdFormat.bitrate ? `${Math.round(sdFormat.bitrate / 1000)} Kbps` : 'Standard',
        fileSizeEstimateMB: approxBytes ? parseFloat((approxBytes / (1024 * 1024)).toFixed(1)) : 0,
        url: sdFormat.url
      });
    }

    // Fallback stream if no formats matched
    if (qualityStreams.length === 0 && (item.url || primaryEntry.url)) {
      qualityStreams.push({
        quality: '1080p',
        label: '1080p Original Stream',
        resolution: '1920x1080',
        bitrate: 'Original',
        fileSizeEstimateMB: 0,
        url: item.url || primaryEntry.url
      });
    }

    return {
      id: videoId,
      title,
      description,
      authorName: item.uploader || authorName,
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
      qualityStreams,
      selectedQuality: 'Best'
    };
  });

  return { profile: profileInfo, videos: extractedVideos };
}

// HTML Fallback Extractor for share links, profile pages, feeds, and redirected URLs
async function extractWithHtmlFallback(targetUrl: string): Promise<{ profile: FacebookProfileInfo; videos: FacebookVideo[] }> {
  const fetchHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  const response = await fetch(targetUrl, { headers: fetchHeaders });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when fetching Facebook URL`);
  }

  const html = await response.text();

  // Page level metadata
  const titleMatch = html.match(/<title>([^<]+)<\/title>/) || html.match(/meta property="og:title" content="([^"]+)"/);
  const descMatch = html.match(/meta property="og:description" content="([^"]+)"/);
  const siteMatch = html.match(/meta property="og:site_name" content="([^"]+)"/);
  const ogImageMatch = html.match(/meta property="og:image" content="([^"]+)"/);

  const rawTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace('| Facebook', '').trim() : 'Facebook Creator';
  const rawDesc = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim() : '';
  const authorName = siteMatch ? siteMatch[1].trim() : (rawTitle !== 'Facebook' ? rawTitle : 'Facebook Creator');
  const mainOgImage = ogImageMatch ? ogImageMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&') : '';

  // Gather ALL HD and SD stream matches across the page
  const hdMatches = [
    ...html.matchAll(/browser_native_hd_url":"([^"]+)"/g),
    ...html.matchAll(/playable_url_quality_hd":"([^"]+)"/g),
    ...html.matchAll(/hd_src":"([^"]+)"/g)
  ];

  const sdMatches = [
    ...html.matchAll(/browser_native_sd_url":"([^"]+)"/g),
    ...html.matchAll(/playable_url":"([^"]+)"/g),
    ...html.matchAll(/sd_src":"([^"]+)"/g),
    ...html.matchAll(/meta property="og:video" content="([^"]+)"/g),
    ...html.matchAll(/meta property="og:video:url" content="([^"]+)"/g)
  ];

  // Gather ALL thumbnail images across the page
  const thumbMatches = [
    ...html.matchAll(/preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/g),
    ...html.matchAll(/"image":\{"uri":"([^"]+)"/g),
    ...html.matchAll(/thumbnailUrl":"([^"]+)"/g),
    ...html.matchAll(/meta property="og:image" content="([^"]+)"/g)
  ];

  // Clean and deduplicate URLs
  const cleanHdList = Array.from(new Set(hdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanSdList = Array.from(new Set(sdMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));
  const cleanThumbList = Array.from(new Set(thumbMatches.map(m => m[1].replace(/\\/g, '').replace(/&amp;/g, '&'))));

  // Extract all video IDs found in JS state
  const rawVideoIds = Array.from(new Set([...html.matchAll(/"video_id":"([0-9]+)"/g)].map(m => m[1])));

  // Determine how many distinct videos we can extract
  const maxVideos = Math.max(cleanHdList.length, cleanSdList.length, rawVideoIds.length);

  const isReel = targetUrl.includes('/reel/') || targetUrl.includes('/reels/');
  const extractedVideos: FacebookVideo[] = [];

  for (let idx = 0; idx < maxVideos; idx++) {
    const hdUrl = cleanHdList[idx] || '';
    const sdUrl = cleanSdList[idx] || cleanHdList[idx] || '';

    // If no stream URL at all for this index, skip unless we have HD or SD
    if (!hdUrl && !sdUrl) continue;

    const vId = rawVideoIds[idx] || `fb-vid-${Date.now()}-${idx + 1}`;
    const videoThumb = cleanThumbList[idx] || mainOgImage || '';

    const qualityStreams: QualityStream[] = [];
    if (hdUrl) {
      qualityStreams.push({
        quality: '1080p',
        label: '1080p HD High Quality Stream',
        resolution: '1920x1080',
        bitrate: 'High Quality',
        fileSizeEstimateMB: 0,
        url: hdUrl
      });
    }

    if (sdUrl && sdUrl !== hdUrl) {
      qualityStreams.push({
        quality: '720p',
        label: '720p SD Standard Stream',
        resolution: '1280x720',
        bitrate: 'Standard',
        fileSizeEstimateMB: 0,
        url: sdUrl
      });
    }

    const videoTitle = maxVideos === 1 ? (rawTitle || authorName) : `${authorName} - Video #${idx + 1} (${vId.slice(-6)})`;

    extractedVideos.push({
      id: vId,
      title: videoTitle,
      description: rawDesc || videoTitle,
      authorName,
      authorHandle: `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'facebook'}`,
      authorAvatar: mainOgImage || videoThumb,
      thumbnailUrl: videoThumb || mainOgImage,
      durationSeconds: 0,
      durationFormatted: '00:00',
      uploadDate: new Date().toISOString().split('T')[0],
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      originalPostUrl: targetUrl,
      isReel,
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
    category: extractedVideos.length > 0 ? (extractedVideos.length === 1 ? 'Public Video' : 'Creator Channel / Feed') : 'Facebook Profile',
    bio: rawDesc || `Extracted ${extractedVideos.length} media item(s) for ${authorName}`
  };

  return { profile: profileInfo, videos: extractedVideos };
}

// FB Scraper API endpoint using yt-dlp + HTML Fallback
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Facebook profile or video URL.'
      });
    }

    const cleanUrl = url.trim();

    try {
      // First attempt with yt-dlp
      const ytResult = await extractWithYtDlp(cleanUrl);

      // Check if yt-dlp found only 1 video while the URL is a profile/page/feed with multiple videos
      if (ytResult.videos.length <= 1) {
        try {
          const fallbackResult = await extractWithHtmlFallback(cleanUrl);
          if (fallbackResult.videos.length > ytResult.videos.length) {
            return res.json({
              success: true,
              profile: fallbackResult.profile,
              videos: fallbackResult.videos,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (fErr) {
          // Keep ytResult if fallback failed
        }
      }

      return res.json({
        success: true,
        profile: ytResult.profile,
        videos: ytResult.videos,
        scrapedAt: new Date().toISOString()
      });
    } catch (ytErr: any) {
      console.warn('yt-dlp extraction failed, attempting HTML fallback:', ytErr.message || ytErr);

      try {
        const { profile, videos } = await extractWithHtmlFallback(cleanUrl);
        if (videos.length === 0) {
          throw new Error('No public video streams found.');
        }
        return res.json({
          success: true,
          profile,
          videos,
          scrapedAt: new Date().toISOString()
        });
      } catch (fallbackErr: any) {
        console.warn('HTML fallback also failed:', fallbackErr.message || fallbackErr);

        const rawError = ytErr.stderr || ytErr.message || '';
        let userFriendlyReason = 'No public video streams found at this Facebook link.';

        if (rawError.includes('This video is private') || rawError.includes('private')) {
          userFriendlyReason = 'This Facebook video or post appears to be private or restricted.';
        } else if (rawError.includes('Log in') || rawError.includes('login')) {
          userFriendlyReason = 'Facebook requires login authentication to view this private content.';
        }

        return res.status(400).json({
          success: false,
          message: userFriendlyReason
        });
      }
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
    const videoUrl = req.query.url as string;
    const filename = (req.query.filename as string) || 'facebook_video.mp4';

    if (!videoUrl) {
      return res.status(400).send('Missing video URL parameter.');
    }

    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': '*/*'
      }
    });

    if (!videoResponse.ok) {
      return res.status(502).send('Failed to fetch remote video binary stream.');
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('content-length');

    // Clean filename for HTTP Content-Disposition header
    const safeFilename = encodeURIComponent(filename.replace(/[/\\?%*:|"<>]/g, '_'));

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream binary video buffer to response
    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    console.error('Download proxy error:', err);
    res.status(500).send('Server error downloading video.');
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

