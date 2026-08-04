const https = require('https');
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {headers:{'User-Agent':'Abigail-Bot'}}, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}
(async () => {
  // Get available reactions from otakugifs
  try {
    const r = await fetch('https://api.otakugifs.xyz/gif?reaction=hug');
    const j = JSON.parse(r);
    console.log('Sample response:', JSON.stringify(j).substring(0, 500));
  } catch(e) { console.log('Error:', e.message); }
  
  // Check nekos.best punch endpoint for dimensions
  try {
    const r = await fetch('https://nekos.best/api/v2/punch');
    const j = JSON.parse(r);
    const url = j.results[0].url;
    console.log('punch URL:', url);
    
    // Get dimensions
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let buf = Buffer.alloc(0);
      res.on('data', c => {
        buf = Buffer.concat([buf, c]);
        if (buf.length >= 10) {
          res.destroy();
          const w = buf[6] | (buf[7] << 8);
          const h = buf[8] | (buf[9] << 8);
          console.log('punch dims:', w + 'x' + h);
        }
      });
    });
  } catch(e) { console.log('punch error:', e.message); }
})();
