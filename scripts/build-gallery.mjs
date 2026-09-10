import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encode } from 'blurhash';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicImages = path.join(root, 'public', 'images');
const galleryOut = path.join(root, 'public', 'images', 'gallery');
const contentGalleryDir = path.join(root, 'src', 'content', 'gallery');

const inventoryPath = path.join(root, 'audit', 'gallery-inventory.json');
const duplicateReportPath = path.join(root, 'audit', 'duplicate-report.json');

const SIZES = [480, 768, 1200, 1600];
const WEBP_QUALITY = 82;

function log(...args){ console.log('[gallery]', ...args); }

// Load inventory to get hashes
const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const duplicateReport = JSON.parse(fs.readFileSync(duplicateReportPath, 'utf8'));

// Placeholder hashes: the 10 duplicate groups (all are placeholders as per audit)
const placeholderHashes = new Set(duplicateReport.duplicate_groups.map(g => g.sha256));
log(`Placeholder hashes to exclude from canonical gallery: ${placeholderHashes.size}`);
log([...placeholderHashes].map(h=>h.slice(0,12)).join(', '));

// Also hero-bg is not gallery
const heroPath = '/images/hero-bg.jpg';

// Build list of real images: inventory where sha not in placeholderHashes and not hero
const realImages = inventoryData.inventory.filter(item => {
  if (placeholderHashes.has(item.sha256)) return false;
  if (item.reference_path === heroPath) return false;
  // also exclude empty folders like birthday/others which have 0 files anyway
  return true;
});

log(`Total inventory files: ${inventoryData.inventory.length}`);
log(`Real images after excluding placeholders+hero: ${realImages.length}`); // expect 76

// Category mapping: folder name -> slug, display name, description
const categoryMeta = {
  'Kukyala': { id: 'kukyala', name: 'Kukyala', description: 'Traditional introduction ceremonies — vibrant cultural portraits and family moments.' },
  'weddings': { id: 'weddings', name: 'Weddings', description: 'Stories of love, beautifully captured — from preparations to reception.' },
  'graduation': { id: 'graduation', name: 'Graduation', description: 'Milestones worth framing — proud portraits and family celebrations.' },
  'prom': { id: 'prom', name: 'Prom', description: 'Elegant prom portraits — youthful celebration and style.' },
  'baby-bump': { id: 'baby-bump', name: 'Baby Bump', description: 'Tender maternity sessions — expectation, grace and connection.' },
  'baby-shoots': { id: 'baby-shoots', name: 'Baby Shoots', description: 'Gentle newborn and family moments — soft, warm and timeless.' },
  // empty categories (no real images) — will be created as empty/coming soon
  'Outdoor': { id: 'outdoor', name: 'Outdoor', description: 'Natural light, gardens and scenic settings — coming soon.' },
  'indoor': { id: 'indoor', name: 'Indoor', description: 'Studio portraits with refined light — coming soon.' },
  'headshots': { id: 'headshots', name: 'Headshots', description: 'Professional headshots — clean, confident and polished. Coming soon.' },
  'birthday': { id: 'birthday', name: 'Birthday', description: 'Joyful birthday celebrations — coming soon.' },
  'others': { id: 'others', name: 'Others', description: 'Corporate and special events — coming soon.' },
};

// Group real images by directory
const grouped = {};
for (const img of realImages) {
  const dir = img.directory; // e.g. 'Kukyala', 'weddings'
  if (!grouped[dir]) grouped[dir] = [];
  grouped[dir].push(img);
}
log('Grouped counts:');
for (const [dir, arr] of Object.entries(grouped)) {
  log(`  ${dir}: ${arr.length}`);
}

// Ensure output dirs clean
fs.mkdirSync(galleryOut, { recursive: true });
fs.mkdirSync(contentGalleryDir, { recursive: true });
// Clean previous gallery optimized? Keep originals safe, just ensure gallery dir exists and remove old variants? We'll overwrite.
if (fs.existsSync(galleryOut)) {
  // remove existing gallery variants but keep originals safe (originals are in public/images/<dir>, gallery is separate)
  // So we can clean galleryOut before regeneration
  fs.rmSync(galleryOut, { recursive: true, force: true });
  fs.mkdirSync(galleryOut, { recursive: true });
}

// Helper to normalize filename
function normalizeName(slug, hash, index) {
  // use slug + hash8 + index? But hash alone is stable.
  return `${slug}-${hash.slice(0,8)}.jpg`.toLowerCase(); // will be used for original copy? For optimized we use webp variants
}

// Process each image
let totalOriginalBytes = 0;
let totalOptimizedBytes = 0;
let largestOptimized = { size:0, path:'' };
const imagesMeta = []; // flat list
const categories = [];
const albums = [];

for (const [dir, files] of Object.entries(grouped)) {
  const meta = categoryMeta[dir] || { id: dir.toLowerCase(), name: dir, description: '' };
  const slug = meta.id;
  // sort files deterministically
  files.sort((a,b)=> a.reference_path.localeCompare(b.reference_path));
  const albumId = slug;
  const album = {
    id: albumId,
    slug: slug,
    title: meta.name,
    category: slug,
    description: meta.description,
    cover: null, // set after first image
    imageIds: []
  };

  for (let idx=0; idx<files.length; idx++) {
    const item = files[idx];
    const hash = item.sha256;
    const hash8 = hash.slice(0,8);
    const id = `img_${hash8}`;
    const originalAbs = item.absolute_path;
    const stats = fs.statSync(originalAbs);
    totalOriginalBytes += stats.size;

    // Get metadata via sharp
    const imageSharp = sharp(originalAbs);
    const metadata = await imageSharp.metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Generate blurhash
    // Resize to small for blurhash (32x32)
    const { data, info } = await sharp(originalAbs)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // data is RGBA, need to convert to clamped array for encode? encode expects Uint8ClampedArray RGBA
    const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);

    // Determine sizes to generate (no upscale)
    const variants = {};
    const variantFiles = [];
    const slugOutDir = path.join(galleryOut, slug);
    fs.mkdirSync(slugOutDir, { recursive: true });

    for (const size of SIZES) {
      if (width < size && height < size) continue; // don't upscale
      const outName = `${hash8}-${size}.webp`;
      const outPath = path.join(slugOutDir, outName);
      const publicPath = `/images/gallery/${slug}/${outName}`;
      // Resize to width size, keep aspect, without enlargement
      await sharp(originalAbs)
        .resize({ width: size, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(outPath);
      const outStats = fs.statSync(outPath);
      totalOptimizedBytes += outStats.size;
      if (outStats.size > largestOptimized.size) largestOptimized = { size: outStats.size, path: publicPath };
      variants[size] = publicPath;
      variantFiles.push({ size, path: publicPath, bytes: outStats.size });
    }
    // Also ensure 480 exists as fallback even if original smaller? If original <480, then no variant was created; create one at original size as 480-like fallback
    if (Object.keys(variants).length === 0) {
      const outName = `${hash8}-orig.webp`;
      const outPath = path.join(slugOutDir, outName);
      const publicPath = `/images/gallery/${slug}/${outName}`;
      await sharp(originalAbs).webp({ quality: WEBP_QUALITY }).toFile(outPath);
      const outStats = fs.statSync(outPath);
      totalOptimizedBytes += outStats.size;
      variants['orig'] = publicPath;
    }

    // Choose src as 1200 if exists else largest available
    let src = variants[1200] || variants[768] || variants[1600] || variants[480] || Object.values(variants)[0];
    // srcSet string
    const srcSet = Object.entries(variants).map(([w, p]) => `${p} ${w}w`).join(', ');

    // Alt text: descriptive
    const alt = `${meta.name} — ${path.basename(originalAbs, path.extname(originalAbs))} by Muwan Shots`;

    const imgMeta = {
      id,
      hash,
      hash8,
      original: item.reference_path,
      originalBytes: stats.size,
      category: slug,
      album: albumId,
      filename: `${slug}-${hash8}.webp`, // normalized
      src,
      srcSet,
      variants,
      width,
      height,
      blurHash,
      alt,
      // keep original absolute for verification
    };
    imagesMeta.push(imgMeta);
    album.imageIds.push(id);
    if (!album.cover) album.cover = src;
  }

  // After loop, create category entry
  const catEntry = {
    id: slug,
    slug: slug,
    name: meta.name,
    description: meta.description,
    cover: album.cover,
    imageCount: files.length,
    imageIds: album.imageIds.slice(),
    // For SEO preparation
    seoTitle: `${meta.name} — Muwan Shots`,
    seoDescription: meta.description,
  };
  categories.push(catEntry);
  albums.push(album);
}

// Add empty categories for those with no real images (to keep UI honest)
for (const [dir, meta] of Object.entries(categoryMeta)) {
  if (!grouped[dir] && !categories.find(c=>c.id===meta.id)) {
    categories.push({
      id: meta.id,
      slug: meta.id,
      name: meta.name,
      description: meta.description,
      cover: null,
      imageCount: 0,
      imageIds: [],
      seoTitle: `${meta.name} — Muwan Shots`,
      seoDescription: meta.description,
      empty: true
    });
  }
}

// Sort categories by imageCount desc, then name
categories.sort((a,b)=> b.imageCount - a.imageCount || a.name.localeCompare(b.name));

// Write files
fs.writeFileSync(path.join(contentGalleryDir, 'categories.json'), JSON.stringify(categories, null, 2));
fs.writeFileSync(path.join(contentGalleryDir, 'albums.json'), JSON.stringify(albums, null, 2));
fs.writeFileSync(path.join(contentGalleryDir, 'images.json'), JSON.stringify(imagesMeta, null, 2));

// Also write summary
const summary = {
  generated: new Date().toISOString(),
  realImages: imagesMeta.length,
  categories: categories.length,
  categoriesWithImages: categories.filter(c=>c.imageCount>0).length,
  albums: albums.length,
  totalOriginalBytes,
  totalOriginalMiB: (totalOriginalBytes/1024/1024).toFixed(1),
  totalOriginalGiB: (totalOriginalBytes/1024/1024/1024).toFixed(2),
  totalOptimizedBytes,
  totalOptimizedMiB: (totalOptimizedBytes/1024/1024).toFixed(1),
  reductionPercent: ((1 - totalOptimizedBytes/totalOriginalBytes)*100).toFixed(1),
  averageOptimizedBytes: Math.round(totalOptimizedBytes / Math.max(1, imagesMeta.length* Object.keys(imagesMeta[0]?.variants||{}).length || 1)),
  averagePerImageBytes: Math.round(totalOptimizedBytes / Math.max(1, imagesMeta.length)),
  largestOptimized,
  variantsPerImage: SIZES,
  webpQuality: WEBP_QUALITY,
  placeholderHashesExcluded: [...placeholderHashes].map(h=>h.slice(0,12)),
  placeholderFilesExcludedCount: 25,
};

fs.writeFileSync(path.join(contentGalleryDir, 'summary.json'), JSON.stringify(summary, null, 2));

log('=== Summary ===');
log(JSON.stringify(summary, null, 2));

// Also write a galleryService compatibility shim? We'll create src/content/gallery/index.js
const indexJs = `// Auto-generated gallery index — canonical source for app
import categories from './categories.json';
import images from './images.json';
import albums from './albums.json';
export { categories, images, albums };
export function getCategory(slug){ return categories.find(c=>c.slug===slug); }
export function getImagesForCategory(slug){ const cat=categories.find(c=>c.slug===slug); if(!cat) return []; return images.filter(i=>i.category===slug); }
export function getAlbum(slug){ return albums.find(a=>a.slug===slug); }
export default { categories, images, albums };
`;
fs.writeFileSync(path.join(contentGalleryDir, 'index.js'), indexJs);

log(`Wrote ${imagesMeta.length} images, ${categories.length} categories, ${albums.length} albums to ${contentGalleryDir}`);
log(`Gallery optimized variants at ${galleryOut}`);
