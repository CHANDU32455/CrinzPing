import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import RegisterCallback from "./components/RegisterCallback";
import CrinzExplorer from "./components/CrinzSubmit";
import UserDetailsForm from "./components/UserDetailsForm";
import Layout from "./hooks/Layout";
import AboutApp from "./pages/about";
import ProtectedRoute from "./components/ProtectedRoute";
import CrinzFeed from "./components/CrinzFeed";
import Extras from "./components/Extras";
import AuthManager from "./utils/refreshGen";
import './App.css';
const App = () => {
  return (
    <BrowserRouter>
      <AuthManager />
      <Routes>
        {/* All pages with navbar */}
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutApp />} />

          {/* Protected routes */}
          <Route path="/feed" element={<ProtectedRoute><CrinzFeed /></ProtectedRoute>} />
          <Route path="/extras" element={<ProtectedRoute><Extras /></ProtectedRoute>} />
          <Route path="/contributeCrinz" element={<ProtectedRoute><CrinzExplorer /></ProtectedRoute>} />
          <Route path="/postUserDetails" element={<ProtectedRoute><UserDetailsForm /></ProtectedRoute>} />
        </Route>

        {/* Routes without navbar */}
        <Route path="/register" element={<RegisterCallback />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;