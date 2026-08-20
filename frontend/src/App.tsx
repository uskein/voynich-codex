import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const MyWorldsPage = lazy(() => import('./pages/worlds/MyWorldsPage'));
const CreateWorldPage = lazy(() => import('./pages/worlds/CreateWorldPage'));
const WorldDetailPage = lazy(() => import('./pages/worlds/WorldDetailPage'));
const BestiaryPage = lazy(() => import('./pages/worlds/BestiaryPage'));
const CharactersPage = lazy(() => import('./pages/worlds/CharactersPage'));
const GeographyPage = lazy(() => import('./pages/worlds/GeographyPage'));
const TimelinePage = lazy(() => import('./pages/worlds/TimelinePage'));
const MagicPage = lazy(() => import('./pages/worlds/MagicPage'));
const NationsPage = lazy(() => import('./pages/worlds/NationsPage'));
const HeraldryPage = lazy(() => import('./pages/worlds/HeraldryPage'));
const MyManuscriptsPage = lazy(() => import('./pages/manuscripts/MyManuscriptsPage'));
const CreateManuscriptPage = lazy(() => import('./pages/manuscripts/CreateManuscriptPage'));
const ManuscriptDetailPage = lazy(() => import('./pages/manuscripts/ManuscriptDetailPage'));
const WritingPage = lazy(() => import('./pages/manuscripts/WritingPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDashboardPage = lazy(() => import('./pages/projects/ProjectDashboardPage'));
const ReadingPage = lazy(() => import('./pages/reading/ReadingPage'));
const LibraryPage = lazy(() => import('./pages/library/LibraryPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#d97216' }} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="worlds" element={<MyWorldsPage />} />
              <Route path="worlds/new" element={<CreateWorldPage />} />
              <Route path="worlds/:worldId" element={<WorldDetailPage />} />
              <Route path="worlds/:worldId/bestiary" element={<BestiaryPage />} />
              <Route path="worlds/:worldId/characters" element={<CharactersPage />} />
              <Route path="worlds/:worldId/timeline" element={<TimelinePage />} />
              <Route path="worlds/:worldId/magic" element={<MagicPage />} />
              <Route path="worlds/:worldId/nations" element={<NationsPage />} />
              <Route path="worlds/:worldId/heraldry" element={<HeraldryPage />} />
              <Route path="worlds/:worldId/geography" element={<GeographyPage />} />
              <Route path="manuscripts" element={<MyManuscriptsPage />} />
              <Route path="manuscripts/new" element={<CreateManuscriptPage />} />
              <Route path="manuscripts/:manuscriptId" element={<ManuscriptDetailPage />} />
              <Route path="manuscripts/:manuscriptId/write" element={<WritingPage />} />
              <Route path="manuscripts/:manuscriptId/projects" element={<ProjectsPage />} />
              <Route path="manuscripts/:manuscriptId/project" element={<ProjectDashboardPage />} />
              <Route path="manuscripts/:manuscriptId/read" element={<ReadingPage />} />
              <Route path="manuscripts/:manuscriptId/read/:chapterId" element={<ReadingPage />} />
              <Route path="library" element={<LibraryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
