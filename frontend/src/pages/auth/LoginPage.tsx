import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18n } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
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
          <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Voynich Codex</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            placeholder="you@example.com"
            required
          />

          <div className="relative">
            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              placeholder="••••••••"
              required
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

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            {t('auth.login')}
          </Button>
        </form>

        <p className="mt-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-burnt-400 hover:text-burnt-300">
            {t('auth.signUp')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;