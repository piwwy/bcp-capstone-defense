import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesToCompress = [
  'public/images/g1.png',
  'public/images/g2.png',
  'public/images/g3.png',
  'public/images/g4.png',
];

for (const img of imagesToCompress) {
  const input = path.resolve(img);
  const output = input.replace('.png', '.jpg');
  
  const stats = fs.statSync(input);
  console.log(`Processing ${img} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
  
  await sharp(input)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, progressive: true })
    .toFile(output);
  
  const newStats = fs.statSync(output);
  console.log(`  -> ${path.basename(output)} (${(newStats.size / 1024 / 1024).toFixed(2)} MB) - saved ${((1 - newStats.size / stats.size) * 100).toFixed(0)}%`);
}

// Also compress other large images
const otherLarge = [
  'public/images/gcashsample.png',
  'public/images/logosmss.png',
  'public/images/bcp-logo-transparent.png',
  'public/images/pbuilding.png',
  'public/images/l.png',
];

for (const img of otherLarge) {
  const input = path.resolve(img);
  if (!fs.existsSync(input)) continue;
  
  const output = input.replace('.png', '-compressed.png');
  const stats = fs.statSync(input);
  
  console.log(`Compressing ${img} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
  
  await sharp(input)
    .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 70, compressionLevel: 9 })
    .toFile(output);
  
  const newStats = fs.statSync(output);
  // Replace original with compressed
  fs.unlinkSync(input);
  fs.renameSync(output, input);
  console.log(`  -> ${path.basename(img)} (${(newStats.size / 1024 / 1024).toFixed(2)} MB) - saved ${((1 - newStats.size / stats.size) * 100).toFixed(0)}%`);
}

console.log('\nDone! Now update code references from .png to .jpg for g1-g4.');
