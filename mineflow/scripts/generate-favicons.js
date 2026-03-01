const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = process.argv[2];
const publicDir = process.argv[3];

if (!sourceImage || !publicDir) {
    console.error('Usage: node generate-favicons.js <source-image> <public-dir>');
    process.exit(1);
}

const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
];

async function generate() {
    try {
        // Generate PNGs
        for (const { name, size } of sizes) {
            await sharp(sourceImage)
                .resize(size, size)
                .toFile(path.join(publicDir, name));
            console.log(`Generated ${name}`);
        }

        // Generate favicon.ico (using 32x32 as a fallback)
        await sharp(sourceImage)
            .resize(32, 32)
            .toFile(path.join(publicDir, 'favicon.ico'));
        console.log('Generated favicon.ico (fallback as 32x32 PNG)');

    } catch (err) {
        console.error('Error generating favicons:', err);
        process.exit(1);
    }
}

generate();
