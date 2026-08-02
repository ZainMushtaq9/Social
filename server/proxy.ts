import { Request, Response } from 'express';

export async function handleDownloadProxy(req: Request, res: Response) {
  const targetUrl = req.query.url as string;
  const filename = (req.query.filename as string) || 'download.mp4';

  if (!targetUrl) {
    return res.status(400).json({ error: 'Target media URL parameter is required' });
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (req.headers.range) {
      forwardHeaders['Range'] = req.headers.range;
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: forwardHeaders
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return res.status(upstreamResponse.status).json({
        error: `Upstream media server returned error status ${upstreamResponse.status}`
      });
    }

    // Set download headers
    res.status(upstreamResponse.status);

    const contentType = upstreamResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamResponse.headers.get('content-length');
    const contentRange = upstreamResponse.headers.get('content-range');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    if (!upstreamResponse.body) {
      return res.status(500).json({ error: 'Media stream body unavailable' });
    }

    const reader = upstreamResponse.body.getReader();

    req.on('close', () => {
      reader.cancel();
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }

    res.end();
  } catch (err: any) {
    console.error('Download Proxy Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Streaming proxy failed' });
    }
  }
}
