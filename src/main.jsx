// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProductsProvider } from "./contexts/ProductsContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initGA } from './analytics';

// Layout
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import DebugPanel from "./components/DebugPanel";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import TestFirestore from "./pages/TestFirestore";

// Old pages (for backwards compatibility)
import App from "./App.jsx";
import DetallePrenda from "./DetallePrenda.jsx";

initGA(import.meta.env.VITE_GA_ID || "G-9DD5YEX28R");

const Layout = ({ children }) => (
  <>
    <ScrollToTop />
    <Header />
    {children}
    <Footer />
    <CartDrawer />
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
  </>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProductsProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Nuevas rutas con nuevo diseño */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/catalogo" element={<Layout><Catalog /></Layout>} />
            <Route path="/producto/:productId" element={<Layout><ProductDetail /></Layout>} />
            <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
            <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
            <Route path="/checkout/cancel" element={<Layout><CheckoutCancel /></Layout>} />
            
            {/* Ruta de prueba para debugging */}
            <Route path="/test" element={<TestFirestore />} />
            
            {/* Rutas antiguas para compatibilidad */}
            <Route path="/old" element={<App />} />
            <Route path="/detallePrenda/:id" element={<DetallePrenda />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </ProductsProvider>
  </StrictMode>
);
