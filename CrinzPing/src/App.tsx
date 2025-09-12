import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HeadProvider } from "react-head";

import Home from "./pages/home";
import CrinzFeed from "./pages/CrinzFeed";
import CrinzExplorer from "./pages/CrinzSubmit";
import AboutApp from "./pages/about";
import Extras from "./pages/Extras";
import SharedCrinzFeedPost from "./pages/SharedCrinzFeedPost";
import InvalidPage from "./pages/invalidPage";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import GoodBye from "./pages/GoodBye";
import PrivacySettingsPage from "./pages/PrivacySettingsPage";

import ProfileMorePosts from "./profile/ProfileMorePosts";
import PublicProfileEncodedView from "./profile/PublicProfileView";
import OthersProfileView from "./profile/OthersProfileView";

import RegisterCallback from "./components/RegisterCallback";
import UserDetailsForm from "./components/UserDetailsForm";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./hooks/Layout";
import AuthManager from "./utils/refreshGen";

import ShowFollowers from "./following/ShowFollowers";
import ShowFollowing from "./following/ShowFollowing";
import "./App.css";

const App = () => {
  return (
    <HeadProvider>
      <BrowserRouter>
        <AuthManager />
        <Routes>
          {/* All pages with navbar */}
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutApp />} />
            <Route path="/post/:encoded" element={<SharedCrinzFeedPost />} />
            <Route path="/public-profile" element={<PublicProfileEncodedView />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacySettings" element={<PrivacySettingsPage />} />
            <Route path="/goodbye" element={<GoodBye />} />

            {/* Protected routes */}
            <Route path="/feed" element={<ProtectedRoute><CrinzFeed /></ProtectedRoute>} />
            {/**
            <Route path="/feed" element={<ProtectedRoute><FeedContainer /></ProtectedRoute>} />
            <Route path="/feed/:tab" element={<ProtectedRoute><FeedContainer /></ProtectedRoute>} />
             */}
            <Route path="/extras" element={<ProtectedRoute><Extras /></ProtectedRoute>} />
            <Route path="/contributeCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
            <Route path="/addPostCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
            <Route path="/addVideoCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
            <Route path="/postUserDetails" element={<ProtectedRoute><UserDetailsForm /></ProtectedRoute>} />
            <Route path="/profile/:sub" element={<ProtectedRoute><OthersProfileView /></ProtectedRoute>} />
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
    </HeadProvider>
  );
};

export default App;