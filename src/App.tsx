import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HeadProvider } from "react-head";
import { AdsProvider } from "./context/AdsContext";
import AdsScriptLoader from "./components/AdsScriptLoader";

import Home from "./pages/home";
import ReelsFeed from "./feed/tabs/ReelsFeed";
import GlobalFeed from "./feed/tabs/GlobalFeed";
import UserPostsFeed from "./feed/tabs/personalizedfeed/PersonalizedFeed";
import CrinzExplorer from "./pages/CrinzSubmit";
import AboutApp from "./pages/about";
import CrinzProfile from "./profile/CrinzProfile"; // ✅ Use the new simplified component
import PostsAllPage from "./profile/PostsAllPage";
import ReelsAllPage from "./profile/ReelsAllPage";
import SharedCrinzFeedPost from "./pages/SharedCrinzFeedPost";
import InvalidPage from "./pages/invalidPage";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import GoodBye from "./pages/GoodBye";
import PrivacySettingsPage from "./pages/PrivacySettingsPage";
import NetworkErrorChip from "./components/NetworkErrorPopup";

import CreatePost from "./feed/tabs/createPost";
import CreateReel from "./feed/tabs/createReel";

import ProfileMorePosts from "./profile/ProfileMorePosts";
// ❌ Remove: import OthersProfileView from "./profile/OthersProfileView"; // No longer needed

import RegisterCallback from "./components/RegisterCallback";
import UserDetailsForm from "./components/UserDetailsForm";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./hooks/Layout";
import AuthManager from "./utils/refreshGen";

import ShowFollowers from "./profile/following/ShowFollowers";
import ShowFollowing from "./profile/following/ShowFollowing";
import SharedContentPage from "./pages/SharedContentPage";
import "./App.css";

const App = () => {
  return (
    <HeadProvider>
      <AdsProvider>
        <AdsScriptLoader />
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
      </AdsProvider>
    </HeadProvider>
  );
};

export default App;