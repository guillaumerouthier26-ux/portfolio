import sharp from 'sharp';
import { readdirSync, statSync, renameSync } from 'fs';
import { join, extname, basename } from 'path';

const PHOTOS_DIR = './photos';
const MAX_WIDTH   = 2560;
const JPG_QUALITY = 82;
const PNG_QUALITY = { compressionLevel: 9, effort: 10 };

const files = readdirSync(PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

let totalBefore = 0;
let totalAfter  = 0;

for (const file of files) {
  const input  = join(PHOTOS_DIR, file);
  const tmp    = input + '.tmp';
  const ext    = extname(file).toLowerCase();
  const before = statSync(input).size;
  totalBefore += before;

  try {
    let img = sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true });

    if (ext === '.png') {
      await img.png(PNG_QUALITY).toFile(tmp);
    } else {
      await img.jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toFile(tmp);
    }

    const after = statSync(tmp).size;

    // Garde le fichier original si la version compressée est plus grande
    if (after < before) {
      renameSync(tmp, input);
      totalAfter += after;
      console.log(`✓ ${file.padEnd(40)} ${Math.round(before/1024)}KB → ${Math.round(after/1024)}KB  (-${Math.round((1-after/before)*100)}%)`);
    } else {
      const { unlinkSync } = await import('fs');
      unlinkSync(tmp);
      totalAfter += before;
      console.log(`= ${file.padEnd(40)} ${Math.round(before/1024)}KB  (déjà optimal)`);
    }
  } catch (e) {
    totalAfter += before;
    console.error(`✗ ${file}: ${e.message}`);
  }
}

console.log(`\nTotal : ${Math.round(totalBefore/1024/1024*10)/10} MB → ${Math.round(totalAfter/1024/1024*10)/10} MB  (-${Math.round((1-totalAfter/totalBefore)*100)}%)`);
