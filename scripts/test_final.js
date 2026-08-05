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
  // For quotes - use zenquotes API (working!) for text
  // For images - use a different approach
  // Since popcat quote image API is dead, let's make quotes work as nice text embeds
  // And for memes use the imgflip API to get fresh memes each time

  // Test: use imgflip get_memes to dynamically fetch memes (no hardcoded URLs)
  const r = await f('https://api.imgflip.com/get_memes');
  const data = JSON.parse(r.b);
  console.log('imgflip memes count:', data.data.memes.length);
  console.log('Sample:', data.data.memes[0].name, data.data.memes[0].url);

  // Show that zenquotes works
  const q = await f('https://zenquotes.io/api/random');
  console.log('zenquotes sample:', q.b.substring(0, 100));
})();
