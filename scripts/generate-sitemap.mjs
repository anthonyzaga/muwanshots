import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const baseUrl = 'https://muwanshots.pages.dev';
const today = new Date().toISOString().split('T')[0];

const categories = JSON.parse(fs.readFileSync(path.join(root, 'src/content/gallery/categories.json'), 'utf8'));
const albums = JSON.parse(fs.readFileSync(path.join(root, 'src/content/gallery/albums.json'), 'utf8'));

const urls = [];

// static
const staticRoutes = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/gallery', priority: '0.9', changefreq: 'weekly' },
  { loc: '/services', priority: '0.8', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
  { loc: '/booking', priority: '0.8', changefreq: 'monthly' },
];
for (const r of staticRoutes) urls.push(r);

// categories (only populated)
for (const cat of categories.filter(c=>c.imageCount>0)) {
  urls.push({ loc: `/gallery/${cat.slug}`, priority: '0.8', changefreq: 'weekly' });
}

// albums (category-level)
for (const album of albums) {
  urls.push({ loc: `/gallery/${album.category}/${album.slug}`, priority: '0.7', changefreq: 'weekly' });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
console.log(`Sitemap generated with ${urls.length} URLs`);
console.log(urls.map(u=>u.loc).join('\n'));
