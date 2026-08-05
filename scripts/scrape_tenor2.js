const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function getGifDims(url) {
  return new Promise((resolve) => {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let buf = Buffer.alloc(0);
      res.on('data', c => {
        buf = Buffer.concat([buf, c]);
        if (buf.length >= 10) {
          res.destroy();
          const w = buf[6] | (buf[7] << 8);
          const h = buf[8] | (buf[9] << 8);
          resolve(w + 'x' + h);
        }
      });
      res.on('error', () => resolve('err'));
      res.on('close', () => {
        if (buf.length < 10) resolve('incomplete');
      });
    });
  });
}

(async () => {
  try {
    // Visit a specific GIF view page to get full-size URL from OG tags
    const gifId = 'mHPObD6UdX8AAAAM'; // first result from search
    const html = await fetchPage('https://tenor.com/view/neon-genesis-evangelion-shinji-ikari-gif-' + gifId.replace('AAAAM',''));
    console.log('View page length:', html.length);
    
    // Check og:image, og:video, twitter:image
    const ogImage = html.match(/property="og:image" content="([^"]+)"/i);
    const ogVideo = html.match(/property="og:video(?::url)?" content="([^"]+)"/i);
    const twitterImage = html.match(/name="twitter:image" content="([^"]+)"/i);
    const twitterPlayer = html.match(/name="twitter:player:stream" content="([^"]+)"/i);
    
    console.log('og:image:', ogImage?.[1] || 'not found');
    console.log('og:video:', ogVideo?.[1] || 'not found');
    console.log('twitter:image:', twitterImage?.[1] || 'not found');
    console.log('twitter:player:stream:', twitterPlayer?.[1] || 'not found');
    
    // Find ALL unique URLs in the page that point to tenor media
    const allMedia = [...new Set([...html.matchAll(/https:\/\/[^"'\s]+\.tenor\.com\/[^"]+\.gif/gi)].map(m => m[0]))];
    console.log('\nAll tenor GIF URLs in page:', allMedia.length);
    for (const u of allMedia) {
      const dims = await getGifDims(u);
      console.log(dims, u);
    }
    
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
