const https = require('https');
function f(url) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 10000);
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
  const tests = [
    // Quote image APIs
    ['popcat quote', 'https://api.popcat.xyz/quote?text=Hello&author=World'],
    ['popcat quote+image', 'https://api.popcat.xyz/quote?text=Hello&author=World&image=https://i.imgur.com/7J6DDNL.png'],
    // Try other known APIs
    ['inspire api', 'https://inspirobot.me/api?generate=true'],
    ['quotes cover', 'https://quotescover.com/wp-json/wp/v2/posts?per_page=1'],
    // Try placeholder/og approach
    ['og twitter card', 'https://og.twitter.com/Dracula345336'],
    // Try lucidchart / placemat APIs
    ['placeholder image', 'https://placehold.co/400x300/2C2F33/white?text=Hello+World'],
    // Try quickchart for text on image
    ['quickchart', 'https://quickchart.io/chart?c={type:%27bar%27,data:{labels:[%27A%27],datasets:[{data:[5]}]}}'],
    // Try memegen for text on image
    ['memegen blank top', 'https://api.memegen.link/images/blank/-/Hello/bottom_text.png'],
    ['memegen custom', 'https://api.memegen.link/images/custom/top_text/bottom_text.png'],
    // Try imgflip caption
    ['imgflip caption', 'https://api.imgflip.com/caption_image?template_id=181913649&username=ImgflipUser&password=ImgflipPass&text0=Hello&text1=World'],
    // Try Picsum for images (random)
    ['picsum', 'https://picsum.photos/500/300'],
    // Try unsplash random
    ['unsplash', 'https://source.unsplash.com/random/500x300'],
    // Try narrativas API  
    ['dummyimage', 'https://dummyimage.com/500x300/2C2F33/ffffff&text=Hello+World'],
  ];

  for (const [name, url] of tests) {
    try {
      const r = await f(url);
      const isImage = r.t && (r.t.startsWith('image') || r.t === 'application/octet-stream');
      console.log(name + ':', r.s, r.t?.substring(0, 30), isImage ? 'IMAGE' : r.b?.substring(0, 80));
    } catch (e) {
      console.log(name + ' ERR:', e.message);
    }
  }
})();
