import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import RegisterCallback from "./components/RegisterCallback";
import CrinzExplorer from "./components/CrinzSubmit";
import UserDetailsForm from "./components/UserDetailsForm";
import Layout from "./hooks/Layout";
import AboutApp from "./pages/about";
import ProtectedRoute from "./components/ProtectedRoute";
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages with navbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/contributeCrinz"
            element={
              <ProtectedRoute>
                <CrinzExplorer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/postUserDetails"
            element={
              <ProtectedRoute>
                <UserDetailsForm />
              </ProtectedRoute>
            }
          />

          <Route path="/about" element={<AboutApp />} />
        </Route>

        {/* Routes without navbar */}
        <Route path="/register" element={<RegisterCallback />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
