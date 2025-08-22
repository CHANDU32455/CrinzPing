import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HeadProvider } from "react-head";
import Home from "./pages/home";
import RegisterCallback from "./components/RegisterCallback";
import CrinzExplorer from "./pages/CrinzSubmit";
import UserDetailsForm from "./components/UserDetailsForm";
import Layout from "./hooks/Layout";
import AboutApp from "./pages/about";
import ProtectedRoute from "./components/ProtectedRoute";
import CrinzFeed from "./pages/CrinzFeed";
import Extras from "./pages/Extras";
import InvalidPage from "./pages/invalidPage";
import AuthManager from "./utils/refreshGen";
import SharedCrinzFeedPost from "./pages/SharedCrinzFeedPost";
import './App.css';

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

            {/* Protected routes */}
            <Route path="/feed" element={<ProtectedRoute><CrinzFeed /></ProtectedRoute>} />
            <Route path="/extras" element={<ProtectedRoute><Extras /></ProtectedRoute>} />
            <Route path="/contributeCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
            <Route path="/postUserDetails" element={<ProtectedRoute><UserDetailsForm /></ProtectedRoute>} />
          </Route>

          {/* Routes without navbar */}
          <Route path="/register" element={<RegisterCallback />} />

          {/* Catch-all for invalid URLs */}
          <Route path="*" element={<InvalidPage />} />
        </Routes>
      </BrowserRouter>
    </HeadProvider>
  );
};

export default App;
