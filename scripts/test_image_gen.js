const https = require('https');

// Test approach: Use canvas-free quote image generation
// Method: Generate a beautiful quote image via an SVG-to-PNG service
// OR use a simple approach that works in Discord

// The SIMPLEST working solution: 
// Use background images from picsum + Discord embed with quote text + background thumbnail
// This gives the visual "image" feel without needing image generation

// BUT user wants actual image with text ON it.
// Let me try quickchart.io which renders charts - can we use it for text?

function testUrl(url, label) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(`${label}: TIMEOUT`), 8000);
    https.get(url, { headers: { 'User-Agent': 'Abigail-Bot' } }, res => {
      clearTimeout(t);
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return testUrl(res.headers.location, label).then(resolve);
      }
      const ct = res.headers['content-type'] || '';
      const cl = parseInt(res.headers['content-length'] || '0');
      const isImg = ct.startsWith('image');
      res.resume();
      resolve(`${label}: ${res.statusCode} ${ct.substring(0, 25)} ${isImg ? 'IMAGE' : cl + 'B'}`);
    }).on('error', e => { clearTimeout(t); resolve(`${label}: ERR ${e.message}`); });
  });
}

(async () => {
  // Approach 1: Use quickchart for text rendering  
  const results = await Promise.all([
    testUrl('https://quickchart.io/chart/render/as-png?c=%7Btype%3A%27text%27%2Cdata%3A%7Blabels%3A%5B%27quote%27%5D%2Cdatasets%3A%5B%7Bdata%3A%5B1%5D%2Clabel%3A%27The+hardest+thing+is+watching+the+one+you+love%2C+love+someone+else.%27%7D%5D%7D%2Coptions%3A%7Bplugins%3A%7Btitle%3A%7Bdisplay%3Afalse%7D%2Cdatalabels%3A%7Bdisplay%3Atrue%7D%7D%7D&w=600&h=400&bkg=%232C2F33&f=png&devicePixelRatio=2', 'quickchart text'),
    // Approach 2: Use a clean SVG rendering service  
    testUrl('https://quickchart.io/chart/render/as-png?c=%7Btype%3A%27doughnut%27%2Cdata%3A%7Blabels%3A%5B%27A%27%2C%27B%27%5D%2Cdatasets%3A%5B%7Bdata%3A%5B100%2C0%5D%2CbackgroundColor%3A%5B%27%232C2F33%27%2C%27%23ffffff%27%5D%7D%5D%7D%2Coptions%3A%7Bplugins%3A%7Btitle%3A%7Bdisplay%3Atrue%2Ctext%3A%27Hello+World+Quote%27%2CfontSize%3A24%2CfontColor%3A%27%23ffffff%27%7D%7D%7D&w=600&h=400&bkg=%232C2F33&f=png', 'quickchart donut'),
    // Approach 3: Direct PNG placeholder with custom text  
    testUrl('https://placehold.co/600x400/2C2F33/ffffff/png?text=Hello+World', 'placehold.co png'),
  ]);
  results.forEach(r => console.log(r));
})();
