import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Tag, Album, Star } from 'lucide-react';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ photos: 0, categories: 0, albums: 0, published: 0, featured: 0, publishedAlbums: 0, pending: 0, failed: 0, ready: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [photosRes, catsRes, albumsRes, featuredRes, pubAlbumsRes, recentRes, allPhotosRes] = await Promise.all([
          api.getPhotos({ all: true, limit: 1 }).catch(() => ({ total: 0 })),
          api.getCategories({ all: true }).catch(() => ({ categories: [] })),
          api.getAlbums({ all: true }).catch(() => ({ albums: [] })),
          api.getPhotos({ featured: true, limit: 1 }).catch(() => ({ total: 0 })),
          api.getAlbums({}).catch(() => ({ albums: [] })),
          api.getPhotos({ all: true, limit: 5 }).catch(() => ({ photos: [] })),
          api.getPhotos({ all: true, limit: 100 }).catch(() => ({ photos: [] })),
        ]);
        const pub = await api.getPhotos({ limit: 1 }).catch(() => ({ total: 0 }));
        const allPhotos = allPhotosRes.photos || [];
        const pending = allPhotos.filter(p => p.processing_status === 'pending').length;
        const failed = allPhotos.filter(p => p.processing_status === 'failed').length;
        const ready = allPhotos.filter(p => !p.processing_status || p.processing_status === 'ready').length;
        setStats({
          photos: photosRes.total ?? 0,
          categories: catsRes.categories?.length ?? 0,
          albums: albumsRes.albums?.length ?? 0,
          published: pub.total ?? 0,
          featured: featuredRes.total ?? 0,
          publishedAlbums: pubAlbumsRes.albums?.length ?? 0,
          pending,
          failed,
          ready,
        });
        setRecent(recentRes.photos || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="h-40 shimmer rounded-2xl" />;
  }

  const cards = [
    { label: 'Total Photos', value: stats.photos, to: '/admin/photos' },
    { label: 'Published', value: stats.published, to: '/admin/photos' },
    { label: 'Featured', value: stats.featured, to: '/admin/photos' },
    { label: 'Pending', value: stats.pending, to: '/admin/photos' },
    { label: 'Failed', value: stats.failed, to: '/admin/photos' },
    { label: 'Ready', value: stats.ready, to: '/admin/photos' },
    { label: 'Categories', value: stats.categories, to: '/admin/categories' },
    { label: 'Albums', value: stats.albums, to: '/admin/albums' },
    { label: 'Published Albums', value: stats.publishedAlbums, to: '/admin/albums' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Overview of your photography CMS</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-strong)] transition-colors">
            <div className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--text-muted)]">{c.label}</div>
            <div className="font-serif text-3xl mt-2">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/photos" className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold"><Upload size={16} /> Upload Photo</Link>
          <Link to="/admin/categories" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-6 py-2.5 text-sm"><Tag size={16} /> Create Category</Link>
          <Link to="/admin/albums" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-6 py-2.5 text-sm"><Album size={16} /> Create Album</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Star size={16} /> Recent photos</h2>
          <Link to="/admin/photos" className="text-sm underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] mt-3">No photos yet. Upload your first photograph.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {recent.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-soft)]">
                <img src={p.image_url} alt={p.alt_text || ''} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                <div className="p-2 text-xs truncate">{p.title || 'Untitled'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
