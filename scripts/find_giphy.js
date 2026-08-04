const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
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

function getDims(url) {
  return new Promise((resolve) => {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let buf = Buffer.alloc(0);
      res.on('data', c => {
        buf = Buffer.concat([buf, c]);
        if (buf.length >= 10) {
          res.destroy();
          if (buf[0]===0x47&&buf[1]===0x49&&buf[2]===0x46) {
            const w = buf[6]|(buf[7]<<8);
            const h = buf[8]|(buf[9]<<8);
            resolve(w+'x'+h);
          } else resolve('not-gif');
        }
      });
      res.on('error',()=>resolve('err'));
      res.on('close',()=>{if(buf.length<10)resolve('small');});
    });
  });
}

(async () => {
  try {
    // Search giphy for anime choke
    const html = await fetchPage('https://giphy.com/search/anime-choke');
    console.log('Page length:', html.length);
    
    // Extract GIF IDs from giphy URLs in the page
    // Pattern: /gifs/{slug}-{id} or /media/{id}
    const ids = [...html.matchAll(/giphy\.com\/(?:gifs|media)\/(?:[A-Za-z0-9-]+-)?([A-Za-z0-9]{10,})/gi)];
    const uniqueIds = [...new Set(ids.map(m => m[1]))].filter(id => id.length >= 10);
    console.log('GIF IDs found:', uniqueIds.length);
    
    // Construct direct URLs and check
    for (const id of uniqueIds.slice(0, 15)) {
      const url = 'https://media.giphy.com/media/' + id + '/giphy.gif';
      const dims = await getDims(url);
      if (dims !== 'err' && dims !== 'not-gif' && dims !== 'small') {
        console.log(dims, url);
      } else {
        console.log(dims, '(skipped)');
      }
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
