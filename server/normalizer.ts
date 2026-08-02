import { PlatformType, UrlType } from '../src/types';

export interface NormalizedUrlInfo {
  originalUrl: string;
  cleanedUrl: string;
  resolvedUrl: string;
  redirectChain: string[];
  platform: PlatformType;
  urlType: UrlType;
}

/**
 * Remove tracking parameters and normalize social media URLs
 */
export function cleanUrlParams(rawUrl: string): string {
  try {
    let input = rawUrl.trim();
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      input = 'https://' + input;
    }

    const parsed = new URL(input);
    const trackingParams = [
      'fbclid', 'igshid', 'utm_source', 'utm_medium', 'utm_campaign', 
      'utm_term', 'utm_content', 'si', 's', 't', 'ref', 'ref_src',
      'tracking_id', 'feature', 'app', 'share_id', '_r', '_t'
    ];

    trackingParams.forEach(param => {
      parsed.searchParams.delete(param);
    });

    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Detect platform from domain name
 */
export function detectPlatform(urlStr: string): PlatformType {
  const lowercase = urlStr.toLowerCase();
  
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) return 'youtube';
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) return 'facebook';
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) return 'instagram';
  if (lowercase.includes('tiktok.com') || lowercase.includes('vt.tiktok.com')) return 'tiktok';
  if (lowercase.includes('twitter.com') || lowercase.includes('x.com') || lowercase.includes('t.co')) return 'twitter';
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) return 'pinterest';
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) return 'reddit';
  if (lowercase.includes('threads.net')) return 'threads';
  if (lowercase.includes('vimeo.com')) return 'vimeo';
  if (lowercase.includes('dailymotion.com') || lowercase.includes('dai.ly')) return 'dailymotion';
  if (lowercase.includes('soundcloud.com')) return 'soundcloud';

  return 'other';
}

/**
 * Detect URL structure type (Video, Reel, Shorts, Profile, Playlist, Gallery, etc.)
 */
export function detectUrlType(urlStr: string, platform: PlatformType): UrlType {
  const lowercase = urlStr.toLowerCase();

  if (platform === 'youtube') {
    if (lowercase.includes('/shorts/')) return 'shorts';
    if (lowercase.includes('playlist') || lowercase.includes('list=')) return 'playlist';
    if (lowercase.includes('/c/') || lowercase.includes('/channel/') || lowercase.includes('/@')) return 'channel';
    if (lowercase.includes('watch') || lowercase.includes('youtu.be/')) return 'video';
  }

  if (platform === 'facebook') {
    if (lowercase.includes('/reel/') || lowercase.includes('/reels/')) return 'reel';
    if (lowercase.includes('/videos/') || lowercase.includes('/watch/')) return 'video';
    if (lowercase.includes('/profile.php') || lowercase.includes('/people/') || lowercase.includes('/pages/')) return 'profile';
  }

  if (platform === 'instagram') {
    if (lowercase.includes('/reel/') || lowercase.includes('/reels/')) return 'reel';
    if (lowercase.includes('/p/')) return 'video';
    if (lowercase.includes('/stories/')) return 'reel';
    if (!lowercase.includes('/p/') && !lowercase.includes('/reel/')) return 'profile';
  }

  if (platform === 'tiktok') {
    if (lowercase.includes('/video/')) return 'video';
    if (lowercase.includes('/@') && !lowercase.includes('/video/')) return 'profile';
  }

  if (platform === 'twitter') {
    if (lowercase.includes('/status/')) return 'video';
  }

  if (platform === 'reddit') {
    if (lowercase.includes('/comments/')) return 'video';
    if (lowercase.includes('/r/')) return 'channel';
  }

  if (lowercase.includes('/gallery/') || lowercase.includes('/album/')) return 'gallery';

  return 'video';
}

/**
 * Follow HTTP redirects for shortened links (e.g., bit.ly, t.co, vt.tiktok.com, fb.watch, pin.it, youtu.be)
 */
export async function resolveRedirects(urlStr: string): Promise<{ resolvedUrl: string; redirectChain: string[] }> {
  const redirectChain: string[] = [urlStr];
  let currentUrl = urlStr;
  let attempts = 0;
  const maxRedirects = 5;

  while (attempts < maxRedirects) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });

      const location = response.headers.get('location');
      if (location && location !== currentUrl) {
        let nextUrl = location;
        if (nextUrl.startsWith('/')) {
          const origin = new URL(currentUrl).origin;
          nextUrl = origin + nextUrl;
        }
        currentUrl = nextUrl;
        redirectChain.push(currentUrl);
        attempts++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return {
    resolvedUrl: currentUrl,
    redirectChain
  };
}
