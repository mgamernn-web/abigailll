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

(async () => {
  try {
    const html = await fetchPage('https://giphy.com/gifs/anime-choke-JnK14Fk4S6rjBnGdJv');
    // Extract media URLs
    const giphyUrls = [...html.matchAll(/https:\/\/media[0-9]*\.giphy\.com\/media\/[A-Za-z0-9]+\/giphy\.gif/gi)];
 const unique = [...new Set(giphyUrls.map(m => m[0]))];
    console.log('Giphy GIF URLs found:', unique.length);
    unique.forEach((u, i) => console.log(i, u));
    
    // Also check for any GIF URL in the page
    const allGifs = [...html.matchAll(/https:\/\/[^"]+\.gif/gi)];
    const uniqueAll = [...new Set(allGifs.map(m => m[0]))].filter(u => u.includes('giphy') || u.includes('media'));
    console.log('\nAll media GIF URLs:', uniqueAll.length);
    uniqueAll.slice(0, 15).forEach((u, i) => console.log(i, u));
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
