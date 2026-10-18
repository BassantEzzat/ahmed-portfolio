import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAW = 'D:/Projects/ahmed-raw-images';
const OUT = 'public/images/work';
const MANIFEST = 'src/app/data/work.json';
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (EXT.has(path.extname(e.name).toLowerCase())) files.push(p);
  }
  return files;
}

const files = (await walk(RAW)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(path.join(OUT, 'full'), { recursive: true });
await fs.mkdir(path.join(OUT, 'thumb'), { recursive: true });

const manifest = [];
let i = 1;

for (const file of files) {
  const id = String(i).padStart(3, '0');
  const rel = path.relative(RAW, file);
  const parts = rel.split(path.sep);
  const category = parts.length > 1 ? parts[0] : 'all';

  const img = sharp(file).rotate();
  const full = await img
    .clone()
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, 'full', `${id}.webp`));

  await img
    .clone()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(OUT, 'thumb', `${id}.webp`));

  manifest.push({
    id,
    category,
    full: `images/work/full/${id}.webp`,
    thumb: `images/work/thumb/${id}.webp`,
    width: full.width,
    height: full.height,
  });

  console.log(`✔ ${id}  ${rel}`);
  i++;
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${manifest.length} images → ${OUT}`);
