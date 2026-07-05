import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ApiAuthSync } from './components/ApiAuthSync';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Stories } from './pages/Stories';
import { CreateStory } from './pages/CreateStory';
import { ChapterEditor } from './pages/ChapterEditor';
import { StorySeasons } from './pages/StorySeasons';
import { Analytics } from './pages/Analytics';
import { Onboarding } from './pages/Onboarding';
import { Moderation } from './pages/Moderation';
import './styles/theme.css';
import './styles/components.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ApiAuthSync />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/stories/new" element={<CreateStory />} />
                <Route path="/analytics/:storyId" element={<Analytics />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/stories/:storyId" element={<StorySeasons />} />
              </Route>
              {/* Full-screen immersive editor routes outside Layout */}
              <Route path="/stories/:storyId/seasons/:seasonId/chapters/:chapterNum" element={<ChapterEditor />} />
              <Route path="/stories/:storyId/chapters/:chapterNum" element={<ChapterEditor />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;