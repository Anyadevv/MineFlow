import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceFile = 'C:\\Users\\DELL\\Downloads\\icones\\game DV\\usd\\favicon mineflow\\favicon.png';
const publicDir = 'c:\\Users\\DELL\\Downloads\\icones\\game DV\\usd\\MiniFlow\\mineflow\\public';

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon.ico', size: 32 }, // Renamed PNG as .ico
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

async function processImages() {
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  for (const item of sizes) {
    const outputPath = path.join(publicDir, item.name);
    console.log(`Processing ${item.name} (${item.size}x${item.size})...`);
    
    await sharp(sourceFile)
      .resize(item.size, item.size)
      .toFile(outputPath);
      
    console.log(`Saved to ${outputPath}`);
  }
}

processImages().catch(err => {
  console.error(err);
  process.exit(1);
});
