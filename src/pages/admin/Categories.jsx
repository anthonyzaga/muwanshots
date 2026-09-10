import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Eye, EyeOff, ArrowUp, ArrowDown, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_published: true, cover_media_id: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, photoRes] = await Promise.all([
        api.getCategories({ all: true }),
        api.getPhotos({ all: true, limit: 100 }),
      ]);
      setCategories(catRes.categories || []);
      setPhotos(photoRes.photos || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', is_published: true, cover_media_id: '' });
    setShowForm(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', is_published: !!cat.is_published, cover_media_id: cat.cover_media_id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.updateCategory(editing.id, form);
      } else {
        await api.createCategory(form);
      }
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (cat) => {
    const hasPhotos = photos.filter(p => p.category_id === cat.id).length;
    if (hasPhotos > 0) {
      const choice = prompt(`Category "${cat.name}" contains ${hasPhotos} photo(s). Enter category slug to reassign photos, leave empty to orphan (set null), or type "force" to delete with photos orphaned. Cancel to abort.\n\nAvailable slugs: ${categories.filter(c=>c.id!==cat.id).map(c=>c.slug).join(', ')}`);
      if (choice === null) return;
      let url = `/api/categories/${cat.id}`;
      if (choice === 'force') url += '?force=true';
      else if (choice) {
        const target = categories.find(c => c.slug === choice || c.id === choice);
        if (!target) { alert('Target category not found'); return; }
        url += `?reassign_to=${target.id}`;
      } else {
        if (!confirm(`Orphan ${hasPhotos} photos (category_id → null) and delete "${cat.name}"?`)) return;
        url += '?force=true';
      }
      try {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data.error || 'Delete failed');
        await load();
      } catch (e) { setError(e.message); }
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      await load();
    } catch (e) { setError(e.message); }
  };

  const handleTogglePublish = async (cat) => {
    try {
      await api.updateCategory(cat.id, { is_published: !cat.is_published });
      await load();
    } catch (e) { setError(e.message); }
  };

  const move = async (cat, dir) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= categories.length) return;
    const ordered = [...categories];
    const [moved] = ordered.splice(idx, 1);
    ordered.splice(newIdx, 0, moved);
    // Optimistic
    setCategories(ordered);
    // Persist sort_order for all
    try {
      await Promise.all(ordered.map((c, i) => api.updateCategory(c.id, { sort_order: i })));
      await load();
    } catch (e) { setError(e.message); await load(); }
  };

  if (loading) return <div className="h-40 shimmer rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-[var(--text-muted)]">{categories.length} categories • Drag to reorder, set covers, publish</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold"><Plus size={16} /> Create Category</button>
      </div>

      {error && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">{error}</div>}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="font-medium">No categories yet.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create a category to organize your photography.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => {
            const cover = photos.find(p => p.id === cat.cover_media_id);
            const count = photos.filter(p => p.category_id === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-col gap-1">
                  <button disabled={idx===0} onClick={()=>move(cat,-1)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button disabled={idx===categories.length-1} onClick={()=>move(cat,1)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-soft)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                  {cover ? <img src={cover.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-[var(--text-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{cat.name} <span className="text-xs font-normal text-[var(--text-muted)]">/{cat.slug}</span></div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{cat.description || 'No description'} • {count} photos • {cat.is_published ? 'Published' : 'Unpublished'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>handleTogglePublish(cat)} className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.is_published ? 'bg-green-600 text-white' : 'bg-black/10'}`} title={cat.is_published ? 'Published' : 'Unpublished'}>{cat.is_published ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={()=>openEdit(cat)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><Edit2 size={14} /></button>
                  <button onClick={()=>handleDelete(cat)} className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={e=>e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editing ? 'Edit Category' : 'Create Category'}</h2>
              <button type="button" onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Name</label>
              <input value={form.name} onChange={e=>setForm({...form, name: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')})} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" placeholder="Weddings" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Slug</label>
              <input value={form.slug} onChange={e=>setForm({...form, slug: e.target.value})} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" placeholder="weddings" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Cover photo</label>
              <select value={form.cover_media_id} onChange={e=>setForm({...form, cover_media_id: e.target.value})} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm">
                <option value="">No cover</option>
                {photos.slice(0,50).map(p => <option key={p.id} value={p.id}>{p.title || p.r2_key} — {p.category_name || 'No category'}</option>)}
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
    </div>
  );
}
