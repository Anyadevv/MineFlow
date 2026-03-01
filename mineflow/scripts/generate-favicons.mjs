import sharp from 'sharp';
import path from 'path';

const src = String.raw`C:\Users\DELL\.gemini\antigravity\brain\ffafd41c-814e-4d58-b8d1-272ae6b53770\media__1771725433165.png`;
const dest = String.raw`c:\Users\DELL\Downloads\icones\game DV\usd\MiniFlow\mineflow\public`;

const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
];

async function generate() {
    for (const { name, size } of targets) {
        try {
            await sharp(src).resize(size, size).toFile(path.join(dest, name));
            console.log(`Generated ${name}`);
        } catch (err) {
            console.error(`Failed ${name}:`, err);
        }
    }

    try {
        await sharp(src).resize(32, 32).toFile(path.join(dest, 'favicon.ico'));
        console.log('Generated favicon.ico');
    } catch (err) {
        console.error('Failed favicon.ico:', err);
    }
}

generate();
