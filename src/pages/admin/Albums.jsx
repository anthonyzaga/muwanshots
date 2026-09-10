import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Eye, EyeOff, X, Image as ImageIcon, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { api } from '../../lib/api';

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_published: true, cover_media_id: '' });
  const [selectedAlbum, setSelectedAlbum] = useState(null); // for photo management
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [albumRes, photoRes] = await Promise.all([
        api.getAlbums({ all: true }),
        api.getPhotos({ all: true, limit: 100 }),
      ]);
      setAlbums(albumRes.albums || []);
      setPhotos(photoRes.photos || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', is_published: true, cover_media_id: '' });
    setShowForm(true);
  };
  const openEdit = (album) => {
    setEditing(album);
    setForm({ name: album.name, slug: album.slug, description: album.description || '', is_published: !!album.is_published, cover_media_id: album.cover_media_id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updateAlbum(editing.id, form);
      else await api.createAlbum(form);
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (album) => {
    if (!confirm(`Delete album "${album.name}"? Photos will remain but removed from album.`)) return;
    try { await api.deleteAlbum(album.id); await load(); } catch (e) { setError(e.message); }
  };

  const handleTogglePublish = async (album) => {
    try { await api.updateAlbum(album.id, { is_published: !album.is_published }); await load(); } catch (e) { setError(e.message); }
  };

  const openAlbumPhotos = async (album) => {
    setSelectedAlbum(album);
    try {
      const res = await api.getAlbum(album.id);
      setAlbumPhotos(res.photos || []);
    } catch (e) { setError(e.message); }
  };

  const handleAddPhotos = async (photoIds) => {
    if (!selectedAlbum) return;
    try {
      const currentIds = albumPhotos.map(p => p.id);
      const newIds = [...new Set([...currentIds, ...photoIds])];
      await api.updateAlbum(selectedAlbum.id, { photo_ids: newIds });
      const res = await api.getAlbum(selectedAlbum.id);
      setAlbumPhotos(res.photos || []);
      await load();
      setShowAddPhotos(false);
    } catch (e) { setError(e.message); }
  };

  const handleRemovePhoto = async (photoId) => {
    if (!selectedAlbum) return;
    try {
      const newIds = albumPhotos.filter(p => p.id !== photoId).map(p => p.id);
      await api.updateAlbum(selectedAlbum.id, { photo_ids: newIds });
      const res = await api.getAlbum(selectedAlbum.id);
      setAlbumPhotos(res.photos || []);
    } catch (e) { setError(e.message); }
  };

  const movePhoto = async (photo, dir) => {
    if (!selectedAlbum) return;
    const idx = albumPhotos.findIndex(p => p.id === photo.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= albumPhotos.length) return;
    const ordered = [...albumPhotos];
    const [moved] = ordered.splice(idx, 1);
    ordered.splice(newIdx, 0, moved);
    setAlbumPhotos(ordered);
    try {
      await api.updateAlbum(selectedAlbum.id, { photo_ids: ordered.map(p => p.id) });
    } catch (e) { setError(e.message); }
  };

  const filteredPhotosForAdd = photos.filter(p => {
    if (selectedAlbum && albumPhotos.some(ap => ap.id === p.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.alt_text || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="h-40 shimmer rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Albums</h1>
          <p className="text-sm text-[var(--text-muted)]">{albums.length} albums • Group photos without duplicating</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold"><Plus size={16} /> Create Album</button>
      </div>

      {error && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">{error}</div>}

      {albums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="font-medium">No albums yet.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create an album to group related photographs.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {albums.map(album => {
            const cover = photos.find(p => p.id === album.cover_media_id);
            return (
              <div key={album.id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-soft)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                  {cover ? <img src={cover.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-[var(--text-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{album.name} <span className="text-xs font-normal text-[var(--text-muted)]">/{album.slug}</span></div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{album.description || 'No description'} • {album.is_published ? 'Published' : 'Unpublished'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>openAlbumPhotos(album)} className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs">Manage Photos</button>
                  <button onClick={()=>handleTogglePublish(album)} className={`w-8 h-8 rounded-full flex items-center justify-center ${album.is_published ? 'bg-green-600 text-white' : 'bg-black/10'}`}>{album.is_published ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={()=>openEdit(album)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><Edit2 size={14} /></button>
                  <button onClick={()=>handleDelete(album)} className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={e=>e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editing ? 'Edit Album' : 'Create Album'}</h2>
              <button type="button" onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Name</label>
              <input value={form.name} onChange={e=>setForm({...form, name: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')})} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" placeholder="Sarah & John Wedding" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Slug</label>
              <input value={form.slug} onChange={e=>setForm({...form, slug: e.target.value})} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" placeholder="sarah-john-wedding" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Cover photo</label>
              <select value={form.cover_media_id} onChange={e=>setForm({...form, cover_media_id: e.target.value})} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm">
                <option value="">No cover</option>
                {photos.slice(0,50).map(p => <option key={p.id} value={p.id}>{p.title || p.r2_key}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form, is_published: e.target.checked})} /> Published</label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={()=>setShowForm(false)} className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm">Cancel</button>
              <button type="submit" className="flex-1 rounded-full bg-[var(--text-primary)] text-[var(--bg)] py-2.5 text-sm font-semibold">{editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedAlbum && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setSelectedAlbum(null)}>
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{selectedAlbum.name} — Photos ({albumPhotos.length})</h2>
              <button onClick={()=>setSelectedAlbum(null)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><X size={16} /></button>
            </div>

            {albumPhotos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No photos in this album yet. Add some below.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {albumPhotos.map((photo, idx) => (
                  <div key={photo.id} className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-soft)]">
                    <img src={photo.image_url} alt="" className="w-full aspect-[4/3] object-cover" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <button onClick={()=>movePhoto(photo,-1)} disabled={idx===0} className="w-7 h-7 rounded-full bg-white/90 border border-black/10 flex items-center justify-center disabled:opacity-30"><ArrowUp size={12} /></button>
                      <button onClick={()=>movePhoto(photo,1)} disabled={idx===albumPhotos.length-1} className="w-7 h-7 rounded-full bg-white/90 border border-black/10 flex items-center justify-center disabled:opacity-30"><ArrowDown size={12} /></button>
                    </div>
                    <button onClick={()=>handleRemovePhoto(photo.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center"><X size={12} /></button>
                    <div className="p-2 text-xs truncate">{photo.title || 'Untitled'}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-4">
              <button onClick={()=>setShowAddPhotos(true)} className="rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold">+ Add Photos</button>
            </div>

            {showAddPhotos && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search photos" className="w-full pl-8 pr-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm" />
                  </div>
                  <button onClick={()=>setShowAddPhotos(false)} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs">Done</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {filteredPhotosForAdd.slice(0,30).map(photo => (
                    <div key={photo.id} onClick={()=>handleAddPhotos([photo.id])} className="cursor-pointer rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]">
                      <img src={photo.image_url} alt="" className="w-full aspect-[4/3] object-cover" />
                      <div className="p-2 text-xs truncate">{photo.title || 'Untitled'}</div>
                    </div>
                  ))}
                  {filteredPhotosForAdd.length === 0 && <p className="col-span-3 text-center text-sm text-[var(--text-muted)] py-4">No photos found</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
