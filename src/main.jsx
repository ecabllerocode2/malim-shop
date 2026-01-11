// main.jsx
import { StrictMode } from "react";
import PropTypes from 'prop-types';
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProductsProvider } from "./contexts/ProductsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initGA } from './analytics';

// Layout
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DebugPanel from "./components/DebugPanel";
import ScrollToTop from "./components/ScrollToTop";
import StyleAssistant from "./components/chat/StyleAssistant";
import { useState, useEffect } from "react";
import { useAutoUpdate } from "./hooks/useAutoUpdate";

// Pages
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import TestFirestore from "./pages/TestFirestore";

// Old pages (for backwards compatibility)
import App from "./App.jsx";
import DetallePrenda from "./DetallePrenda.jsx";

initGA(import.meta.env.VITE_GA_ID || "G-9DD5YEX28R");

/* eslint-disable react-refresh/only-export-components */
// Wrapper para Catalog que usa location como key
const CatalogWrapper = () => {
  const location = useLocation();
  return <Catalog key={location.search} />;
};

const Layout = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  // Hook para actualización automática
  useAutoUpdate();

  return (
    <>
      <ScrollToTop />
      <Header />
      {children}
      <Footer />
      <DebugPanel />
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
      
      {/* Botón flotante del asistente de estilo */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
        aria-label="Abrir asistente de estilo"
      >
        <span className="text-2xl">💝</span>
        <span className="hidden sm:inline font-semibold">Asesora de Estilo</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>

      {/* Componente del asistente */}
      <StyleAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node,
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
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
    </AuthProvider>
  </StrictMode>
);
