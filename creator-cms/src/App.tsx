import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { Profile } from './pages/Profile';
import { Community } from './pages/Community';
import { Marketing } from './pages/Marketing';
import { Moderation } from './pages/Moderation';
import { ModerationRoute } from './components/ModerationRoute';
import { OnboardingGate } from './components/OnboardingGate';
import { Settings } from './pages/Settings';
import './styles/theme.css';
import './styles/components.css';
import './styles/dashboard.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ApiAuthSync />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<OnboardingGate />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/stories/new" element={<CreateStory />} />
                  <Route path="/analytics/:storyId" element={<Analytics />} />
                  <Route element={<ModerationRoute />}>
                    <Route path="/moderation" element={<Moderation />} />
                  </Route>
                  <Route path="/stories/:storyId" element={<StorySeasons />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/stories/:storyId/seasons/:seasonId/chapters/:chapterNum" element={<ChapterEditor />} />
                <Route path="/stories/:storyId/chapters/:chapterNum" element={<ChapterEditor />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;