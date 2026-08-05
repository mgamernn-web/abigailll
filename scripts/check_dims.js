const https = require('https');

function getDims(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return getDims(res.headers.location).then(resolve);
      }
      let buf = Buffer.alloc(0);
      res.on('data', c => {
        buf = Buffer.concat([buf, c]);
        if (buf.length >= 10) {
          res.destroy();
          if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
            const w = buf[6] | (buf[7] << 8);
            const h = buf[8] | (buf[9] << 8);
            resolve(w + 'x' + h);
          } else {
            resolve('not-gif (0x' + buf[0].toString(16) + ')');
          }
        }
      });
      res.on('error', () => resolve('err'));
      res.on('close', () => { if (buf.length < 10) resolve('incomplete'); });
    });
  });
}

(async () => {
  // Check nekos.best dimensions (follow redirect)
  const urls = [
    ['nekos punch', 'https://nekos.best/api/v2/punch/4fefb86d-71d2-46e2-a650-21183ea90af7.gif'],
    ['nekos slap', 'https://nekos.best/api/v2/slap/11cddfb0-d762-4d12-b55a-2f3da7891c87.gif'],
    ['otakugifs slap', 'https://cdn.otakugifs.xyz/gifs/slap/aiEPmjYF5D.gif'],
    ['otakugifs punch', 'https://cdn.otakugifs.xyz/gifs/punch/f179131bd406f951.gif'],
    ['tenor medium', 'https://media.tenor.com/2nQRYBDT3QQAAAAM/anime-choke-choke.gif'],
  ];
  for (const [name, url] of urls) {
    const d = await getDims(url);
    console.log(name + ':', d);
  }
})();
