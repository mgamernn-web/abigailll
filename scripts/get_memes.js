const https = require('https');
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Abigail-Bot' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body: d }));
    }).on('error', reject);
  });
}
(async () => {
  // 1. Get popular meme template IDs from imgflip
  const memeRes = await fetch('https://api.imgflip.com/get_memes');
  const memeData = JSON.parse(memeRes.body);
  const memes = memeData.data.memes;
  console.log('Total templates:', memes.length);
  
  // Show 50 popular meme URLs
  const valid = [];
  for (const m of memes.slice(0, 60)) {
    try {
      const r = await fetch(m.url);
      if (r.status === 200 && r.type && r.type.startsWith('image')) {
        valid.push(m.url);
      }
    } catch (e) {}
  }
  console.log('Valid meme image URLs:', valid.length);
  valid.forEach((u, i) => console.log(i, "'"+u+"',"));
})();
