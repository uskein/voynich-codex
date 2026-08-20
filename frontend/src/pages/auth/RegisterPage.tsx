import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18n } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    try {
      await register(email, name, password);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <BookOpen className="w-16 h-16 text-burnt-500 mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('auth.joinTitle')}</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{t('auth.joinSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {localError || error}
            </div>
          )}

          <Input
            label={t('auth.name')}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError(); setLocalError(''); }}
            placeholder="Your name"
            required
          />

          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
            placeholder="you@example.com"
            required
          />

          <div className="relative">
            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label={t('auth.confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); }}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            {t('auth.register')}
          </Button>
        </form>

        <p className="mt-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-burnt-400 hover:text-burnt-300">
            {t('auth.signIn')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;