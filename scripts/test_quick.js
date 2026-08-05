const https = require('https');
function f(url) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 5000);
    https.get(url, { headers: { 'User-Agent': 'Abigail-Bot' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(t); return f(res.headers.location).then(resolve).catch(reject);
      }
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { clearTimeout(t); resolve({ s: res.statusCode, t: res.headers['content-type'], b: d }); });
    }).on('error', e => { clearTimeout(t); reject(e); });
  });
}

(async () => {
  // Quick tests - 5 second timeout each
  const tests = [
    ['inspirobot', 'https://inspirobot.me/api?generate=true'],
    ['memegen blank', 'https://api.memegen.link/images/blank/-/Hello/bottom_text.png'],
    ['placeholder', 'https://placehold.co/400x300/2C2F33/white?text=Hello'],
    ['dummyimage', 'https://dummyimage.com/500x300/2C2F33/ffffff&text=Hello'],
    ['picsum', 'https://picsum.photos/500/300'],
  ];
  for (const [name, url] of tests) {
    try {
      const r = await f(url);
      const isImage = r.t && r.t.startsWith('image');
      console.log(name + ':', r.s, r.t?.substring(0, 25), isImage ? 'IMAGE OK' : 'not image');
    } catch (e) { console.log(name + ' ERR:', e.message); }
  }
})();
