import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MyWorldsPage } from './pages/worlds/MyWorldsPage';
import { CreateWorldPage } from './pages/worlds/CreateWorldPage';
import { WorldDetailPage } from './pages/worlds/WorldDetailPage';
import { BestiaryPage } from './pages/worlds/BestiaryPage';
import { CharactersPage } from './pages/worlds/CharactersPage';
import { GeographyPage } from './pages/worlds/GeographyPage';
import { TimelinePage } from './pages/worlds/TimelinePage';
import { MagicPage } from './pages/worlds/MagicPage';
import { NationsPage } from './pages/worlds/NationsPage';
import { HeraldryPage } from './pages/worlds/HeraldryPage';
import { MyManuscriptsPage } from './pages/manuscripts/MyManuscriptsPage';
import { CreateManuscriptPage } from './pages/manuscripts/CreateManuscriptPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ReadingPage } from './pages/reading/ReadingPage';
import { LibraryPage } from './pages/library/LibraryPage';
import { useAuthStore } from './stores/authStore';

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
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected routes */}
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
          <Route path="manuscripts/:manuscriptId/projects" element={<ProjectsPage />} />
          <Route path="manuscripts/:manuscriptId/read" element={<ReadingPage />} />
          <Route path="manuscripts/:manuscriptId/read/:chapterId" element={<ReadingPage />} />
          <Route path="library" element={<LibraryPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
