import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { cleanUrlParams, detectPlatform, detectUrlType, resolveRedirects } from './server/normalizer';
import { extractMediaMetadata } from './server/extractor';
import { handleDownloadProxy } from './server/proxy';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'Universal Media Downloader API', 
      timestamp: new Date().toISOString() 
    });
  });

  // Media Scrape & Metadata Extraction Endpoint
  app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        errorType: 'INVALID_URL',
        message: 'Please provide a valid media URL or link.',
        suggestions: [
          'Paste a public post, reel, video, or playlist URL',
          'Ensure the URL starts with http:// or https://'
        ]
      });
    }

    try {
      const cleanedUrl = cleanUrlParams(url);
      const { resolvedUrl, redirectChain } = await resolveRedirects(cleanedUrl);
      const platform = detectPlatform(resolvedUrl);
      const urlType = detectUrlType(resolvedUrl, platform);

      const response = await extractMediaMetadata(
        url,
        cleanedUrl,
        resolvedUrl,
        redirectChain,
        platform,
        urlType
      );

      res.json(response);
    } catch (err: any) {
      console.error('API /api/scrape error:', err);
      res.status(500).json({
        success: false,
        errorType: 'EXTRACTION_FAILED',
        message: 'Extraction pipeline encountered an unexpected error.',
        errorDetails: err.message || String(err),
        suggestions: [
          'Verify the URL is publicly accessible without login',
          'Try pasting a direct media link'
        ]
      });
    }
  });

  // Download Proxy Endpoint
  app.get('/api/download-proxy', handleDownloadProxy);

  // Vite middleware for development
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
    console.log(`Universal Media Downloader server running on http://localhost:${PORT}`);
  });
}

startServer();
