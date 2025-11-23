import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HeadProvider } from 'react-head';
import { AdsProvider } from './context/AdsContext';
import { CacheProvider } from './context/CacheContext';
import AuthManager from './utils/refreshGen';
import NetworkErrorChip from './components/shared/NetworkErrorPopup';
import Layout from './components/shared/Layout';
import Home from './pages/home';
import AboutApp from './pages/about';
import SharedCrinzFeedPost from './pages/SharedCrinzFeedPost';
import HelpPage from './pages/HelpPage';
import TermsPage from './pages/TermsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import GoodBye from './pages/GoodBye';
import SharedContentPage from './pages/SharedContentPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserPostsFeed from './pages/PersonalizedFeed';
import GlobalFeed from './pages/GlobalFeed';
import ReelsFeed from './pages/ReelsFeed';
import PostsAllPage from './pages/PostsAllPage';
import ReelsAllPage from './pages/ReelsAllPage';
import CrinzExplorer from './pages/CrinzSubmit';
import CreatePost from './components/feed/CreatePost';
import CreateReel from './components/feed/CreateReel';
import UserDetailsForm from './components/profile/UserDetailsForm';
import CrinzProfile from './pages/CrinzProfile';
import ProfileMorePosts from './pages/ProfileMorePosts';
import ShowFollowers from './components/profile/ShowFollowers';
import ShowFollowing from './components/profile/ShowFollowing';
import RegisterCallback from './pages/RegisterCallback';
import InvalidPage from './pages/invalidPage';

const App: React.FC = () => {
  return (
    <HeadProvider>
      <AdsProvider>
        <CacheProvider>
          <BrowserRouter>
            <AuthManager />
            <NetworkErrorChip />
            <Routes>
              {/* All pages with navbar */}
              <Route element={<Layout />}>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutApp />} />
                <Route path="/post/:encoded" element={<SharedCrinzFeedPost />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacySettings" element={<PrivacySettingsPage />} />
                <Route path="/goodbye" element={<GoodBye />} />

                {/* ADD SHARED CONTENT ROUTE HERE */}
                <Route path="/shared/:contentType/:contentId" element={<SharedContentPage />} />

                {/* Protected routes */}
                <Route path="/feed/personalizedfeed" element={<ProtectedRoute><UserPostsFeed /></ProtectedRoute>} />
                <Route path="/feed/crinzmessagesfeed" element={<ProtectedRoute><GlobalFeed /></ProtectedRoute>} />
                <Route path="/feed/reelsfeed" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
                <Route path="/posts/:userId/allposts" element={<PostsAllPage />} />
                <Route path="/reels/:userId/allreels" element={<ReelsAllPage />} />
                <Route path="/contributeCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
                <Route path="/addPostCrinz" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/addVideoCrinz" element={<ProtectedRoute><CreateReel /></ProtectedRoute>} />
                <Route path="/postUserDetails" element={<ProtectedRoute><UserDetailsForm /></ProtectedRoute>} />

                <Route path="/profile" element={<ProtectedRoute><CrinzProfile /></ProtectedRoute>} />
                <Route path="/profile/:sub" element={<CrinzProfile />} />

                <Route path="/profile/:sub/messages" element={<ProtectedRoute><ProfileMorePosts /></ProtectedRoute>} />
                <Route path="/profile/:userSub/more" element={<ProtectedRoute><ProfileMorePosts /></ProtectedRoute>} />
                <Route path="/profile/:userId/followers" element={<ProtectedRoute> <ShowFollowers /> </ProtectedRoute>} />
                <Route path="/profile/:userId/following" element={<ProtectedRoute> <ShowFollowing /> </ProtectedRoute>} />
              </Route>

              {/* Routes without navbar */}
              <Route path="/register" element={<RegisterCallback />} />
              <Route path="/auth/callback" element={<RegisterCallback />} />

              {/* Catch-all for invalid URLs */}
              <Route path="*" element={<InvalidPage />} />
            </Routes>
          </BrowserRouter>
        </CacheProvider>
      </AdsProvider >
    </HeadProvider >
  );
};

export default App;