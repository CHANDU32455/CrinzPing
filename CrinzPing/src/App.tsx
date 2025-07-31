import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import RegisterCallback from "./components/RegisterCallback";
import CrinzExplorer from "./components/CrinzSubmit";
import './App.css';
import UserDetailsForm from "./components/UserDetailsForm";
import UserInfo from "./components/UserInfo";

const App = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/" element={<RegisterCallback />} />
          <Route path="/contributeCrinz" element={<CrinzExplorer />} />
          <Route path="/postUserDetails" element={<UserDetailsForm />} />
          <Route path="/getuserdetails" element={<UserInfo />} />
        </Routes>
    </BrowserRouter>
  );
};

export default App;