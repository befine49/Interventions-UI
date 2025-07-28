import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Hero from './components/Hero';
import HeroHeader from "./components/HeroHeader";
import Footer from "./components/Footer";
import PreviousInterventions from './components/PreviousInterventions';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from "./pages/Logout";

function App() {
  return (
    <>
      <NavBar role="client" />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <HeroHeader />
            <PreviousInterventions />
            <Footer />
          </>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </>
  );
}

export default App;