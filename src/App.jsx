// src/App.jsx
import logo from "./logo.png";
import React, { useEffect, useState, useMemo } from "react";
import { FaSearch, FaWhatsapp } from "react-icons/fa";
import { generateToken, messaging } from "./credenciales";
import { onMessage } from "firebase/messaging";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useProducts } from "./contexts/ProductsContext";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todo");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const { products = [], loading, error } = useProducts();

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("App instalada");
        setShowInstallButton(false);
      } else {
        toast.info("Instalación cancelada");
      }
    } catch (err) {
      toast.error("Error en la instalación: " + (err?.message ?? err));
    } finally {
      setDeferredPrompt(null);
    }
  };

  // Push token + onMessage
  useEffect(() => {
    generateToken();
    try {
      onMessage(messaging, (payload) => {
        console.log("push payload:", payload);
        // muestra notificación ligera en UI
        const title = payload?.notification?.title || "Notificación";
        const body = payload?.notification?.body || "";
        toast.info(title + (body ? ` — ${body}` : ""));
      });
    } catch (e) {
      console.warn("onMessage error:", e);
    }
  }, []);

  // Configuración de categorías (mantuve las mismas reglas que tenías)
  const categoriasConfig = {
    Todo: () => true,
    Invierno: (c) =>
      [
        "Ensambles",
        "Abrigos",
        "Chamarras",
        "Mallones",
        "Sudaderas",
        "Capas",
        "Maxi sudaderas",
        "Gorros",
        "Maxi cobijas",
        "Chalecos",
        "Suéteres",
      ].includes(c),
    Casual: (c) =>
      [
        "Blusones",
        "Pijamas",
        "Blazers",
        "Faldas",
        "Palazzos",
        "Blusas",
        "Gabardinas",
        "Playeras",
        "Sacos",
        "Chalecos",
        "Conjuntos",
        "Maxi vestidos",
        "Camisas",
        "Medias",
      ].includes(c),
    Deporte: (c) => ["Playeras deportivas", "Leggins", "Conjuntos deportivos", "Pants", "Shorts"].includes(c),
    Infantil: (c) => ["Infantil niño", "Infantil niña", "Niños unisex", "Niños uisex"].includes(c),
    Pantalones: (c) => ["Pantalones", "Leggins", "Overoles"].includes(c),
  };

  // filtrado memoizado
  const filteredPrendas = useMemo(() => {
    const filterFn = categoriasConfig[categoriaSeleccionada] ?? categoriasConfig.Todo;
    const listado = (products || []).filter((p) => filterFn(p.categoria));
    if (!busqueda) return listado;
    const term = busqueda.toLowerCase();
    return listado.filter((prenda) => (prenda.prenda || "").toLowerCase().includes(term));
  }, [products, categoriaSeleccionada, busqueda]);

  // handlers
  const clickPrenda = (id) => {
    navigate(`/detallePrenda/${id}`); // ojo: usa la ruta en minúsculas (mantén consistencia en main.jsx y DetallePrenda.jsx)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBusqueda = (e) => setBusqueda(e.target.value);

  const clearBusqueda = () => setBusqueda("");

  const enviarWhatsapp = (e, prenda) => {
    e.stopPropagation();
    const foto = prenda.fotos?.[0] ?? "";
    const mensaje = `Hola, estoy interesada en este producto:\n${prenda.prenda}${foto ? `\n${foto}` : ""}`;
    window.open(`https://wa.me/5615967613?text=${encodeURIComponent(mensaje)}`);
  };

  return (
    <div className="bg-gris min-h-screen w-full">
      {/* Botón de instalación */}
      {showInstallButton && (
        <div className="mt-20 z-20 flex w-full justify-center h-20">
          <button
            id="installButton"
            onClick={handleInstallClick}
            className="w-1/3 sm:w-1/4 bg-biege border-titulo border-2 rounded-xl text-texto font-bold font-montserrat py-2 shadow-md"
          >
            Instalar
          </button>
        </div>
      )}

      <ToastContainer position="bottom-right" />

      <div id="header" className="-mt-2 fixed top-0 left-0 flex flex-col z-10 w-full justify-center bg-biege">
        <div className="flex justify-center py-2">
          <img className="h-16 w-16" src={logo} alt="logo Malim" />
        </div>

        <nav
          id="categorias"
          className="bg-biege h-6 -mt-4 px-2 flex flex-row text-texto justify-between mb-1 items-center"
          aria-label="Categorías"
        >
          {["Todo", "Invierno", "Casual", "Deporte", "Infantil", "Pantalones"].map((cat) => (
            <p
              key={cat}
              onClick={() => handleCategoria(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" ? handleCategoria(cat) : null)}
              className={`${categoriaSeleccionada === cat ? "border-b-2 border-cobre" : ""} font-playfair text-sm cursor-pointer select-none`}
            >
              {cat}
            </p>
          ))}
        </nav>
      </div>

      {/* Barra de búsqueda */}
      <div id="barra-busqueda" className="my-2 mt-24 pt-2 mx-5 flex items-center gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-biege" />
          <input
            type="text"
            onChange={handleBusqueda}
            value={busqueda}
            placeholder="Buscar por nombre o categoría"
            className="w-full bg-gris border-2 rounded-xl border-biege placeholder-biege text-sm h-9 pl-10 pr-10 focus:outline-none text-texto font-montserrat"
            aria-label="Buscar productos"
          />
          {busqueda && (
            <button
              onClick={clearBusqueda}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-texto"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista / Grid */}
      <main id="contenedor-lista" className="mx-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 px-2 pb-20">
        {loading ? (
          // skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 lg:h-72 shadow-lg mb-5 bg-gray-200 animate-pulse rounded-md" />
          ))
        ) : error ? (
          <div className="col-span-full text-center text-red-500 py-8">
            Error al cargar el catálogo. Intenta recargar la página.
          </div>
        ) : filteredPrendas.length === 0 ? (
          <div className="col-span-full text-center text-texto py-8">
            No se encontraron productos. {busqueda ? <button onClick={clearBusqueda} className="underline">Limpiar búsqueda</button> : null}
          </div>
        ) : (
          filteredPrendas.map((prenda) => (
            <article
              key={prenda.id}
              onClick={() => clickPrenda(prenda.id)}
              className="h-64 lg:h-72 shadow-lg mb-5 bg-white rounded-md overflow-hidden cursor-pointer"
              aria-label={prenda.prenda}
            >
              <img
                loading="lazy"
                src={prenda.fotos?.[0] ?? logo}
                alt={prenda.prenda}
                className="w-full h-4/5 object-cover"
              />
              <div className="flex flex-col items-center justify-between pb-2 px-2 h-1/5">
                <p className="w-full font-playfair text-sm font-bold text-texto truncate">{prenda.prenda}</p>
                <div className="w-full flex flex-row justify-between">
                  <p className=" font-playfair text-md text-biege font-bold truncate">${prenda.precio}</p>

                  <p className=" font-playfair text-sm text-texto  truncate">{prenda.talla}</p>

                </div>
              </div>
            </article>
          ))
        )}
        {/* Botón flotante de WhatsApp */}
        <a
          href="https://wa.me/525615967613?text=¡Hola!%20Me%20gustaría%20saber%20más%20sobre%20sus%20productos."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 flex items-center space-x-2 bg-green-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105 z-50"
          style={{ animation: 'fadeInUp 0.5s ease-out' }}
        >
          {/* Icono WhatsApp */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 .5C5.648.5.5 5.648.5 12c0 2.129.563 4.167 1.625 5.958L.5 23.5l5.708-1.625A11.465 11.465 0 0012 23.5c6.352 0 11.5-5.148 11.5-11.5S18.352.5 12 .5zm0 20.833c-1.885 0-3.723-.5-5.333-1.458l-.385-.229-3.385.958.969-3.292-.25-.396A9.35 9.35 0 012.667 12c0-5.167 4.167-9.333 9.333-9.333 5.167 0 9.333 4.167 9.333 9.333 0 5.167-4.166 9.333-9.333 9.333zm5.208-7.292c-.281-.146-1.656-.812-1.917-.906-.26-.094-.448-.146-.635.146-.188.292-.729.906-.896 1.094-.167.188-.333.219-.615.073-.281-.146-1.188-.438-2.26-1.396-.833-.74-1.396-1.656-1.563-1.938-.167-.281-.018-.438.125-.584.125-.125.281-.333.417-.5.135-.167.18-.292.27-.479.09-.188.045-.354-.022-.5-.073-.146-.635-1.531-.87-2.094-.229-.542-.469-.469-.635-.479-.167-.01-.354-.012-.542-.012s-.5.073-.76.354c-.26.281-1.01.99-1.01 2.417s1.031 2.802 1.177 2.99c.146.188 2.031 3.094 4.917 4.333.688.292 1.219.469 1.635.604.688.219 1.313.188 1.802.115.552-.082 1.656-.677 1.896-1.333.24-.656.24-1.219.167-1.333-.073-.115-.26-.188-.542-.333z" />
          </svg>

          {/* Texto */}
          <span className="hidden sm:inline text-sm font-medium">
            ¿Necesitas ayuda? Escríbenos
          </span>
        </a>

        {/* Animación */}
        <style>
          {`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}
        </style>

      </main>
    </div>
  );
}

export default App;
