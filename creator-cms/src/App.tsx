import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { ApiAuthSync } from './components/ApiAuthSync';
import { Layout } from './components/Layout';
import { OverlayScrollManager } from './components/OverlayScrollManager';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Stories } from './pages/Stories';
import { CreateStory } from './pages/CreateStory';
import { ChapterEditor } from './pages/ChapterEditor';
import { EpistolaryEditor } from './pages/editors/EpistolaryEditor';
import { EnglishEditor } from './pages/editors/EnglishEditor';
import { BranchingEditor } from './pages/editors/BranchingEditor';
import { AlternateReaderShell } from './pages/readers/AlternateReaderShell';
import { StorySeasons } from './pages/StorySeasons';
import { StoryBible } from './pages/StoryBible';
import { MediaLibrary } from './pages/MediaLibrary';
import { Analytics } from './pages/Analytics';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { Community } from './pages/Community';
import { Moderation } from './pages/Moderation';
import { ModerationRoute } from './components/ModerationRoute';
import { LabsRoute } from './components/LabsRoute';
import { OnboardingGate } from './components/OnboardingGate';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Schedule } from './pages/Schedule';
import { PublishingCenter } from './pages/PublishingCenter';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { EventCreate } from './pages/EventCreate';
import { ReviewerMarketplace } from './pages/ReviewerMarketplace';
import { ReviewWorkspace } from './pages/ReviewWorkspace';
import { TagsModeration } from './pages/TagsModeration';
import { Monetization } from './pages/Monetization';
import { PlatformMap } from './pages/PlatformMap';
import { MagazineEdition } from './pages/MagazineEdition';
import './styles/theme.css';
import './styles/scroll-overlay.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/studio.css';
import './styles/premium-shell.css';
import './styles/dashboard-premium.css';
import './styles/events-premium.css';
import './styles/auth-premium.css';
import './styles/world-class-v2.css';
import './styles/editor-premium-v2.css';
import './styles/review-workspace-premium-v2.css';
import './styles/motion-system.css';
import './styles/secondary-pages-premium.css';
import './styles/alternate-editors-premium.css';
import './styles/hub-pages-premium.css';
import './styles/layout-rhythm-v2.css';
import './styles/empty-state-system.css';
import './styles/cohesion-wave12.css';
import './styles/design-tokens.css';
import './styles/championship-premium.css';
import './styles/cohesion-wave13.css';
import './styles/cohesion-wave14.css';
import './styles/cohesion-wave15.css';
import './styles/cohesion-wave16.css';
import './styles/cohesion-wave17.css';
import './styles/cohesion-wave18.css';
import './styles/cohesion-wave19.css';
import './styles/cohesion-wave20.css';
import './styles/cohesion-wave21.css';
import './styles/cohesion-wave22.css';
import './styles/cohesion-wave23.css';
import './styles/cohesion-wave24.css';
import './styles/cohesion-wave25.css';
import './styles/cohesion-wave26.css';
import './styles/cohesion-wave27.css';
import './styles/cohesion-wave28.css';
import './styles/cohesion-wave29.css';
import './styles/narrative-os.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocaleProvider>
        <AuthProvider>
          <ApiAuthSync />
          <BrowserRouter>
            <div className="app-viewport">
              <OverlayScrollManager />
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<OnboardingGate />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/publishing" element={<PublishingCenter />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/stories/new" element={<CreateStory />} />
                  <Route path="/analytics/:storyId" element={<Analytics />} />
                  <Route element={<ModerationRoute />}>
                    <Route path="/moderation" element={<Moderation />} />
                  </Route>
                  <Route path="/stories/:storyId" element={<StorySeasons />} />
                  <Route path="/stories/:storyId/bible" element={<StoryBible />} />
                  <Route path="/stories/:storyId/media" element={<MediaLibrary />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/community" element={<Community />} />
                  {/* Events are core GTM + revenue (not Labs) — authors must register freely */}
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/new" element={<EventCreate />} />
                  <Route path="/events/:eventId" element={<EventDetail />} />
                  <Route path="/magazine" element={<MagazineEdition />} />
                  {/* Literary Council is core trust infrastructure — not Labs-gated (DEC-007 revision) */}
                  <Route path="/reviewers" element={<ReviewerMarketplace />} />
                  <Route element={<LabsRoute />}>
                    <Route path="/tags" element={<TagsModeration />} />
                    <Route path="/platform" element={<PlatformMap />} />
                  </Route>
                  <Route path="/monetization" element={<Monetization />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
                <Route path="/stories/:storyId/seasons/:seasonId/chapters/:chapterNum" element={<ChapterEditor />} />
                <Route path="/stories/:storyId/chapters/:chapterNum" element={<ChapterEditor />} />
                <Route path="/stories/:storyId/epistolary/:chapterNum" element={<EpistolaryEditor />} />
                <Route path="/stories/:storyId/branching/:chapterNum" element={<BranchingEditor />} />
                <Route path="/stories/:storyId/read/:format/:chapterNum" element={<AlternateReaderShell />} />
                <Route path="/stories/:storyId/en/chapters/:chapterNum" element={<EnglishEditor />} />
                <Route path="/reviewers/assignments/:assignmentId" element={<ReviewWorkspace />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;