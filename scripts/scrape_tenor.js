const https = require('https');
const http = require('http');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
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

(async () => {
  try {
    const html = await fetchPage('https://tenor.com/search/anime-strangle-gifs');
    console.log('HTML length:', html.length);
    
    // Extract all media.tenor.com GIF URLs
    const mediaUrls = [...html.matchAll(/(https:\/\/media\.tenor\.com\/[^"]+\.gif)/gi)];
    const uniqueUrls = [...new Set(mediaUrls.map(m => m[1]))];
    
    console.log('Unique GIF URLs found:', uniqueUrls.length);
    uniqueUrls.slice(0, 20).forEach((u, i) => console.log(i, u));
    
    // Also try json-ld or script tags
    const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    console.log('\nJSON-LD blocks:', jsonLd.length);
    
    // Try to find GIF data in script tags
    const scriptData = [...html.matchAll(/"gif"\s*:\s*"(https:[^"]+)"/gi)];
    console.log('\nGIF URLs in scripts:', scriptData.length);
    scriptData.slice(0, 10).forEach((m, i) => console.log(i, m[1]));
    
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
