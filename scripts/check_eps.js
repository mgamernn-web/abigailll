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
  const r = await fetch('https://nekos.best/api/v2/endpoints');
  const j = JSON.parse(r);
  const eps = Object.keys(j);
  console.log('All endpoints:', eps.join(', '));
})();
