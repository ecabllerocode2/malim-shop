// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import DetallePrenda from "./DetallePrenda.jsx";
import { ProductsProvider } from "./contexts/ProductsContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProductsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/detallePrenda/:id" element={<DetallePrenda />} />
        </Routes>
      </BrowserRouter>
    </ProductsProvider>
  </StrictMode>
);
