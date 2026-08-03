const ZAI = (await import('/home/z/.bun/install/global/node_modules/z-ai-web-dev-sdk/dist/index.js')).default;
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();

  const imageBuffer = fs.readFileSync('/home/z/my-project/upload/sigma_pookie.jpg');
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  console.log('Image loaded, sending edit request...');

  const response = await zai.images.generations.edit({
    prompt: "Transform this into a stunning 3D beach-themed Discord bot banner with 16:9 widescreen ratio. Place the main character on a beautiful tropical beach at golden hour sunset with warm orange, pink and purple sky. Add 3D depth effect with parallax layers - ocean waves in foreground, palm trees on sides, soft sand texture. Add elegant 3D text 'Abigail' in the center with glossy metallic finish, slight shadow beneath for floating 3D effect, and warm sunset reflections on the letters. Beach vibes: seashells, gentle waves foam, birds in the distance, sun rays peeking through clouds. Cinematic, photorealistic 3D render style, high quality, vibrant colors",
    images: [{ url: dataUrl }],
    size: '1344x768'
  });

  const imageBase64 = response.data[0].base64;
  const buffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync('/home/z/my-project/download/abigail-banner.png', buffer);

  console.log('Banner saved!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
