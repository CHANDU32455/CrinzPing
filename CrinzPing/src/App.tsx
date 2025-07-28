import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import RegisterCallback from "./components/RegisterCallback";

const App = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/" element={<RegisterCallback />} />
        </Routes>
    </BrowserRouter>
  );
};

export default App;