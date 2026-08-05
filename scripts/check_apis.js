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
  // Test memegen.link API for quote images
  try {
    const r = await fetch('https://api.memegen.link/images/blank/Hello_World/bottom_text.png');
    console.log('memegen blank:', r.status, r.type);
  } catch (e) { console.log('memegen err:', e.message); }

  // Test imgflip caption_image (no auth = fails)
  // Instead just test some direct meme image URLs

  // Test old broken meme URLs
  const urls = [
    'https://i.imgflip.com/4acd7j.jpg',
    'https://i.imgflip.com/4t0m5.jpg',
    'https://i.imgflip.com/2fm6x.jpg',
    'https://i.imgflip.com/30b1gx.jpg',
    'https://i.imgflip.com/4/1h7in3.jpg',
    'https://i.imgflip.com/4/3umnzg.jpg',
    'https://i.imgflip.com/4/4t0m5.jpg',
    'https://i.imgflip.com/4/2fm6x.jpg',
    'https://i.imgflip.com/4/g0rjno.jpg',
    'https://i.imgflip.com/4/1otk96.jpg',
    'https://i.imgflip.com/4/261o6j.jpg',
    'https://i.imgflip.com/4/4m0p5l.jpg',
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u);
      console.log(r.status, r.type?.substring(0, 20), u);
    } catch (e) { console.log('ERR', u); }
  }
})();
