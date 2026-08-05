const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' }
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
  const queries = ['anime-strangle', 'anime-neck-grab', 'anime-choking'];
  const allIds = new Set();
  
  for (const q of queries) {
    try {
      const html = await fetchPage('https://giphy.com/search/' + q);
      const ids = [...html.matchAll(/giphy\.com\/(?:gifs|media)\/(?:[A-Za-z0-9-]+-)?([A-Za-z0-9]{10,})/gi)];
      ids.forEach(m => allIds.add(m[1]));
      console.log(q + ': found ' + ids.length + ' IDs, total unique: ' + allIds.size);
    } catch(e) { console.log(q + ' error:', e.message); }
  }
  
  console.log('\nTotal unique IDs:', allIds.size);
  console.log('\nChecking all as GIF URLs...');
  const results = [];
  for (const id of [...allIds]) {
    const url = 'https://media.giphy.com/media/' + id + '/giphy.gif';
    const dims = await getDims(url);
    if (dims !== 'err' && dims !== 'not-gif' && dims !== 'small') {
      const w = parseInt(dims);
      results.push({ dims, url, width: w });
    }
  }
  
  // Sort by width descending and show top 20
  results.sort((a, b) => b.width - a.width);
  results.slice(0, 20).forEach((r, i) => console.log(r.dims, r.url));
})();
