import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { manuscriptAPI, worldAPI } from '../../services/api';
import { Link } from 'react-router-dom';

export function CreateManuscriptPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [worldId, setWorldId] = useState('');
  const [worlds, setWorlds] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorlds();
  }, []);

  const loadWorlds = async () => {
    try {
      const { data } = await worldAPI.list();
      setWorlds(data.worlds || []);
    } catch (err) {
      console.error('Failed to load worlds:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await manuscriptAPI.create({
        title,
        subtitle,
        synopsis,
        genre,
        worldId: worldId || undefined
      });
      navigate(`/manuscripts/${data.manuscript.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create manuscript');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genres = [
    'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance',
    'Historical', 'Literary Fiction', 'Poetry', 'Non-Fiction', 'Other'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/manuscripts" className="inline-flex items-center gap-2 text-parchment-400 hover:text-parchment-200 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to My Manuscripts
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-burnt-500/20">
                <BookOpen className="w-6 h-6 text-burnt-400" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-parchment-100">Create New Manuscript</h1>
                <p className="text-sm text-parchment-400">Start writing your story</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="e.g. The Chronicles of Aetheria"
                required
              />

              <Input
                label="Subtitle (optional)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Book One: The Awakening"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-parchment-300">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                >
                  <option value="">Select genre</option>
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-parchment-300">World (optional)</label>
                <select
                  value={worldId}
                  onChange={(e) => setWorldId(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-100 focus:outline-none focus:ring-2 focus:ring-burnt-500"
                >
                  <option value="">No world (standalone)</option>
                  {worlds.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-parchment-300">Synopsis</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Brief description of your story..."
                  rows={4}
                  className="w-full px-3 py-2 bg-midnight-800 border border-midnight-600 rounded-lg text-parchment-100 placeholder-midnight-400 focus:outline-none focus:ring-2 focus:ring-burnt-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => navigate('/manuscripts')}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create Manuscript
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default CreateManuscriptPage;