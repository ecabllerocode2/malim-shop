// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProductsProvider } from "./contexts/ProductsContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initGA } from './analytics';

// Layout
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DebugPanel from "./components/DebugPanel";
import ScrollToTop from "./components/ScrollToTop";
import UpdatePrompt from "./components/UpdatePrompt";

// Pages
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import TestFirestore from "./pages/TestFirestore";

// Old pages (for backwards compatibility)
import App from "./App.jsx";
import DetallePrenda from "./DetallePrenda.jsx";

initGA(import.meta.env.VITE_GA_ID || "G-9DD5YEX28R");

// Wrapper para Catalog que usa location como key
const CatalogWrapper = () => {
  const location = useLocation();
  return <Catalog key={location.search} />;
};

const Layout = ({ children }) => (
  <>
    <ScrollToTop />
    <Header />
    {children}
    <Footer />
    <DebugPanel />
    <UpdatePrompt />
    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProductsProvider>
      <BrowserRouter>
        <Routes>
          {/* Nuevas rutas con nuevo diseño */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/catalogo" element={<Layout><CatalogWrapper /></Layout>} />
          <Route path="/producto/:productId" element={<Layout><ProductDetail /></Layout>} />
          
          {/* Ruta de prueba para debugging */}
          <Route path="/test" element={<TestFirestore />} />
          
          {/* Rutas antiguas para compatibilidad */}
          <Route path="/old" element={<App />} />
          <Route path="/detallePrenda/:id" element={<DetallePrenda />} />
        </Routes>
      </BrowserRouter>
    </ProductsProvider>
  </StrictMode>
);
