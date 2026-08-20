import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft, Image as ImageIcon, X, Lock, Eye, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { WorldSimulator } from '../../components/visualizers/WorldSimulator';
import { worldAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const TONES = [
  { value: 'fantasy', label: 'Fantasy', color: '#7c3aed' },
  { value: 'scifi', label: 'Sci-Fi', color: '#3b82f6' },
  { value: 'cosmic', label: 'Cosmic', color: '#a855f7' },
  { value: 'steam', label: 'Steampunk', color: '#f59e0b' },
  { value: 'ancient', label: 'Ancient', color: '#d4af37' }
];

const VISIBILITIES = [
  { value: 'PRIVATE', label: 'Private', icon: Lock },
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'UNLISTED', label: 'Unlisted', icon: Eye }
];

export function CreateWorldPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [tone, setTone] = useState('fantasy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setCoverImage(newImageUrl.trim());
    setNewImageUrl('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage((event.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('World name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await worldAPI.create({
        name,
        description,
        coverImage: coverImage || undefined,
        visibility
      });
      navigate(`/worlds/${data.world.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create world');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/worlds" className="inline-flex items-center gap-2 text-parchment-400 hover:text-parchment-200 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to My Worlds
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-burnt-500/20">
                <Globe className="w-6 h-6 text-burnt-400" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-parchment-100">Create New World</h1>
                <p className="text-sm text-parchment-400">Start building your universe</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                {/* Left column: fields */}
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <Input
                    label="World Name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="e.g. The Realm of Aetheria"
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-parchment-300">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your world..."
                      rows={4}
                      className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                    />
                  </div>

                  {/* Cover image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-parchment-300">Cover Image</label>
                    {coverImage ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-24 border border-dashed rounded-lg flex items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>No cover image yet</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Image URL (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                      />
                      <Button type="button" variant="secondary" onClick={addImageUrl} disabled={!newImageUrl.trim()}>
                        <ImageIcon className="w-4 h-4" /> Add
                      </Button>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                      <ImageIcon className="w-4 h-4 mr-2" /> Upload image
                    </Button>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-parchment-300">Visibility</label>
                    <div className="flex gap-2">
                      {VISIBILITIES.map((v) => {
                        const Icon = v.icon;
                        return (
                          <button
                            type="button"
                            key={v.value}
                            onClick={() => setVisibility(v.value)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                              visibility === v.value
                                ? 'border-burnt-500 bg-burnt-500/10 ring-1 ring-burnt-500 text-parchment-100'
                                : 'border-midnight-600 bg-midnight-700/60 text-parchment-400 hover:border-midnight-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" /> {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-parchment-300">Atmosphere</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TONES.map((tn) => (
                        <button
                          type="button"
                          key={tn.value}
                          onClick={() => setTone(tn.value)}
                          className={`flex flex-col items-center gap-1.5 px-1 py-2 rounded-lg border transition-all ${
                            tone === tn.value
                              ? 'border-burnt-500 bg-burnt-500/10 ring-1 ring-burnt-500'
                              : 'border-midnight-600 bg-midnight-700/60 hover:border-midnight-500'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tn.color }} />
                          <span className="text-[11px] leading-tight text-center text-parchment-300">{tn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column: live simulator */}
                <div className="lg:sticky lg:top-0 self-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-burnt-400" />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>World Simulator</span>
                    </div>
                    <WorldSimulator world={{ name, description, coverImage }} tone={tone} />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Live preview of your world as it takes shape. The image, description and atmosphere update in real time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="button" variant="ghost" onClick={() => navigate('/worlds')}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create World
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default CreateWorldPage;