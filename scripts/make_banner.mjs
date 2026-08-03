const ZAI = (await import('/home/z/.bun/install/global/node_modules/z-ai-web-dev-sdk/dist/index.js')).default;
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();

  const imageBuffer = fs.readFileSync('/home/z/my-project/upload/sigma_pookie.jpg');
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  console.log('Image loaded, sending edit request...');

  const response = await zai.images.generations.edit({
    prompt: "A beautiful beach scene with calm ocean waves and soft sunset sky. The main character is standing on the beach. Large bold text 'Abigail' is clearly written across the banner in white color with dark shadow outline so it is readable. The text must say exactly Abigail. Simple, clean, natural beach vibes, warm tones, high quality",
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
