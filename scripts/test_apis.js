const https = require('https');
function f(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 8000);
    https.get(url, { headers: { 'User-Agent': 'Abigail-Bot' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timeout);
        return f(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { clearTimeout(timeout); resolve({ s: res.statusCode, t: res.headers['content-type'], b: d }); });
    }).on('error', e => { clearTimeout(timeout); reject(e); });
  });
}

(async () => {
  // Test various quote image generation APIs with timeout
  const tests = [
    ['quotable', 'https://api.quotable.io/quotes/random'],
    ['zenquotes', 'https://zenquotes.io/api/random'],
    ['memegen blank', 'https://api.memegen.link/images/blank.png'],
  ];

  for (const [name, url] of tests) {
    try {
      const r = await f(url);
      console.log(name + ':', r.s, r.t?.substring(0, 30), r.b?.substring(0, 150));
    } catch (e) {
      console.log(name + ' ERR:', e.message);
    }
  }
})();
