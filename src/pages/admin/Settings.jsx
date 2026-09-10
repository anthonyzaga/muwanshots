import { useEffect, useState } from 'react';
import { Save, Image as ImageIcon, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { clearSiteSettingsCache } from '../../hooks/useSiteSettings';

const GROUPS = [
  {
    title: 'General',
    keys: ['site_name', 'site_tagline', 'email', 'phone', 'location'],
  },
  {
    title: 'Social',
    keys: ['instagram_url', 'facebook_url', 'tiktok_url', 'youtube_url', 'whatsapp_url'],
  },
  {
    title: 'Homepage — Hero',
    keys: ['hero_title', 'hero_subtitle', 'hero_description', 'hero_cta_text', 'hero_cta_url', 'hero_image'],
  },
  {
    title: 'Homepage — About & Contact',
    keys: ['about_title', 'about_description', 'contact_title', 'contact_description'],
  },
  {
    title: 'SEO',
    keys: ['default_meta_title', 'default_meta_description', 'og_image'],
  },
];

const LABELS = {
  site_name: 'Business name',
  site_tagline: 'Tagline',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  instagram_url: 'Instagram URL',
  facebook_url: 'Facebook URL',
  tiktok_url: 'TikTok URL',
  youtube_url: 'YouTube URL',
  whatsapp_url: 'WhatsApp URL',
  hero_title: 'Hero title',
  hero_subtitle: 'Hero subtitle',
  hero_description: 'Hero description',
  hero_cta_text: 'CTA text',
  hero_cta_url: 'CTA URL',
  hero_image: 'Hero image (URL)',
  about_title: 'About title',
  about_description: 'About description',
  contact_title: 'Contact title',
  contact_description: 'Contact description',
  default_meta_title: 'Site title (SEO)',
  default_meta_description: 'Default meta description',
  og_image: 'OG image (URL)',
};

export default function Settings() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState({});
  const [initial, setInitial] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPicker, setShowPicker] = useState(null); // which key is picking image for
  const [photos, setPhotos] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    api.getSettings().then(res => {
      setSettings(res.settings || {});
      setInitial(res.settings || {});
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
    api.getPhotos({ all: true, limit: 50 }).then(r => setPhotos(r.photos || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(initial));
  }, [settings, initial]);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.updateSettings(settings);
      setSettings(res.settings || settings);
      setInitial(res.settings || settings);
      clearSiteSettingsCache();
      setSuccess('Settings saved successfully — public site will update within 5 minutes (CDN cache)');
      setHasChanges(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (photo) => {
    if (showPicker) {
      update(showPicker, photo.image_url);
      setShowPicker(null);
    }
  };

  if (loading) return <div className="h-40 shimmer rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage homepage, social links, SEO and contact information. Changes apply to the public site immediately.</p>
      </div>

      {error && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">{error}</div>}
      {success && <div role="status" className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-3">{success}</div>}

      {GROUPS.map(group => (
        <div key={group.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold">{group.title}</h2>
          <div className="mt-4 space-y-4">
            {group.keys.map(key => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-medium">{LABELS[key] || key}</label>
                {(key === 'hero_description' || key === 'about_description' || key === 'contact_description' || key === 'default_meta_description') ? (
                  <textarea
                    value={settings[key] || ''}
                    onChange={e => update(key, e.target.value)}
                    rows={key === 'default_meta_description' ? 2 : 3}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                ) : key === 'hero_image' || key === 'og_image' ? (
                  <div className="flex gap-2">
                    <input
                      value={settings[key] || ''}
                      onChange={e => update(key, e.target.value)}
                      placeholder="/images/hero-bg.jpg or https://..."
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                    <button type="button" onClick={() => setShowPicker(key)} className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm flex items-center gap-1.5 hover:bg-[var(--surface-hover)]"><ImageIcon size={14} /> Pick</button>
                  </div>
                ) : (
                  <input
                    value={settings[key] || ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder={LABELS[key]}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                )}
                {(key === 'hero_image' || key === 'og_image') && settings[key] && (
                  <img src={settings[key]} alt="" className="mt-2 w-full max-h-48 object-cover rounded-xl border border-[var(--border)]" onError={e => e.target.style.display='none'} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold">Current admin</h2>
        <div className="mt-3 text-sm space-y-1">
          <div><span className="text-[var(--text-muted)]">Name:</span> {admin?.name || '—'}</div>
          <div><span className="text-[var(--text-muted)]">Email:</span> {admin?.email}</div>
          <div><span className="text-[var(--text-muted)]">ID:</span> <code className="text-xs bg-[var(--bg-soft)] border border-[var(--border)] px-1.5 py-0.5 rounded">{admin?.id}</code></div>
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur px-6 py-4 shadow-lg">
        <div className="text-sm">
          {hasChanges ? <span className="text-amber-600 font-medium">Unsaved changes</span> : <span className="text-[var(--text-muted)]">All changes saved</span>}
        </div>
        <button onClick={handleSave} disabled={!hasChanges || saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold disabled:opacity-40 hover:opacity-90">
          <Save size={16} /> {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPicker(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Select photo for {LABELS[showPicker]}</h3>
              <button onClick={() => setShowPicker(null)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(p => (
                <button key={p.id} onClick={() => handleImageSelect(p)} className="group rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] text-left">
                  <img src={p.image_url} alt={p.alt_text || ''} className="w-full aspect-[4/3] object-cover group-hover:opacity-90" loading="lazy" />
                  <div className="p-2 text-xs truncate">{p.title || p.r2_key}</div>
                </button>
              ))}
            </div>
            {photos.length === 0 && <p className="text-sm text-[var(--text-muted)] mt-4">No photos available. Upload photos first.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
