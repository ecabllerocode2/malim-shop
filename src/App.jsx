// src/App.jsx
import logo from "./logo.png";
import React, { useEffect, useState, useMemo, useLayoutEffect, useRef } from "react";
import { FaSearch, FaWhatsapp } from "react-icons/fa";
import { generateToken, messaging } from "./credenciales";
import { onMessage } from "firebase/messaging";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useProducts } from "./contexts/ProductsContext";
import { initGA, pageView, trackSelectItem, trackWhatsappClick, trackSearch } from "./analytics";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Patria");
  const [busqueda, setBusqueda] = useState("");

  // altura real del header para evitar huecos
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // nudge del botón de WhatsApp
  const [nudge, setNudge] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], loading, error } = useProducts();

  // Inicialización GA
  useEffect(() => {
    initGA("G-9DD5YEX28R");
  }, []);

  // Registrar page_view en SPA
  useEffect(() => {
    pageView(location.pathname, document.title);
  }, [location.pathname]);

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
        const title = payload?.notification?.title || "Notificación";
        const body = payload?.notification?.body || "";
        toast.info(title + (body ? ` — ${body}` : ""));
      });
    } catch (e) {
      console.warn("onMessage error:", e);
    }
  }, []);

  // Config categorías
  const categoriasConfig = {
    Todo: () => true,
    Patria: (c) => c === "Patria",
    Invierno: (c) =>
      ["Ensambles", "Abrigos", "Chamarras", "Mallones", "Sudaderas", "Capas", "Maxi sudaderas", "Gorros", "Maxi cobijas", "Chalecos", "Suéteres"].includes(c),
    Casual: (c) =>
      ["Blusones", "Pijamas", "Blazers", "Faldas", "Palazzos", "Blusas", "Gabardinas", "Playeras", "Sacos", "Chalecos", "Conjuntos", "Maxi vestidos", "Camisas", "Medias"].includes(c),
    Deporte: (c) => ["Playeras deportivas", "Leggins", "Conjuntos deportivos", "Pants", "Shorts"].includes(c),
    Infantil: (c) => ["Infantil niño", "Infantil niña", "Niños unisex", "Niños uisex"].includes(c),
    Pantalones: (c) => ["Pantalones", "Leggins", "Overoles"].includes(c),
  };

  const filteredPrendas = useMemo(() => {
    const filterFn = categoriasConfig[categoriaSeleccionada] ?? categoriasConfig.Todo;
    const listado = (products || []).filter((p) => filterFn(p.categoria));
    if (!busqueda) return listado;
    const term = busqueda.toLowerCase();
    return listado.filter((prenda) => (prenda.prenda || "").toLowerCase().includes(term));
  }, [products, categoriaSeleccionada, busqueda]);

  // Registro de búsqueda en GA4
  useEffect(() => {
    if (busqueda.trim().length > 0) {
      trackSearch(busqueda.trim(), filteredPrendas.length);
    }
  }, [busqueda, filteredPrendas.length]);

  const clickPrenda = (id) => {
    const prenda = products.find((p) => p.id === id);
    if (prenda) {
      trackSelectItem({
        id: prenda.id,
        nombre: prenda.prenda,
        categoria: prenda.categoria
      });
    }
    navigate(`/detallePrenda/${id}`);
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
    const waUrl = `https://wa.me/5615967613?text=${encodeURIComponent(mensaje)}`;
    trackWhatsappClick({
      id: prenda.id,
      nombre: prenda.prenda,
      categoria: prenda.categoria,
      precio: prenda.precio
    }, "5615967613", waUrl);
  };

  // === Medir altura del header para NO dejar huecos ni tapar la búsqueda ===
  const measureHeader = () => {
    const h = headerRef.current?.offsetHeight ?? 0;
    setHeaderHeight(h);
  };

  useLayoutEffect(() => {
    measureHeader();
  }, [categoriaSeleccionada]);

  useEffect(() => {
    const obs = new ResizeObserver(measureHeader);
    if (headerRef.current) obs.observe(headerRef.current);
    window.addEventListener("resize", measureHeader);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", measureHeader);
    };
  }, []);

  // === Nudge del botón de WhatsApp cada 15s por 1.2s ===
  useEffect(() => {
    const interval = setInterval(() => {
      setNudge(true);
      const t = setTimeout(() => setNudge(false), 1200);
      return () => clearTimeout(t);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen w-full ${categoriaSeleccionada === "Patria" ? "" : "bg-gris"}`}
      style={
        categoriaSeleccionada === "Patria"
          ? { background: "linear-gradient(90deg, rgba(0,128,0,0.8) 0%, rgba(255,255,255,0.9) 50%, rgba(255,0,0,0.8) 100%)" }
          : {}
      }
    >
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

      {/* HEADER: mantenemos bg-biege (sin transparencia), sin márgenes negativos */}
      <div
        id="header"
        ref={headerRef}
        className="fixed top-0 left-0 flex flex-col z-20 w-full justify-center bg-biege"
      >
        <div className="flex justify-center items-center h-16">
          <img className="h-16 w-16" src={logo} alt="logo Malim" />
        </div>

        {categoriaSeleccionada === "Patria" && (
          <div className="w-full py-3 text-center font-bold text-xs lg:text-lg font-playfair text-gris shadow-md">
            🇲🇽 Celebrar a México es celebrar la belleza de sus mujeres 🇲🇽
          </div>
        )}

        <nav
          id="categorias"
          className="bg-biege h-6 px-2 flex flex-row text-texto justify-between items-center"
        >
          {["Patria", "Todo", "Invierno", "Casual", "Deporte", "Pantalones"].map((cat) => (
            <p
              key={cat}
              onClick={() => handleCategoria(cat)}
              className={`font-playfair text-sm cursor-pointer select-none ${
                categoriaSeleccionada === cat
                  ? cat === "Patria"
                    ? "bg-gradient-to-r from-green-600 via-white to-red-600 text-black px-2 rounded-md"
                    : "border-b-2 border-cobre"
                  : ""
              }`}
            >
              {cat}
            </p>
          ))}
        </nav>
      </div>

      {/* CONTENIDO: lo empujamos exactamente la altura del header (sin huecos) */}
      <div style={{ paddingTop: headerHeight }}>
        {/* Barra de búsqueda pegada al header */}
        <div id="barra-busqueda" className="my-2 pt-2 mx-5 flex items-center gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-biege" />
            <input
              type="text"
              onChange={handleBusqueda}
              value={busqueda}
              placeholder="Buscar por nombre o categoría"
              className="w-full bg-gris border-2 rounded-xl border-biege placeholder-biege text-sm h-9 pl-10 pr-10"
            />
            {busqueda && (
              <button
                onClick={clearBusqueda}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-texto"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <main
          id="contenedor-lista"
          className="mx-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 px-2 pb-24"
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 lg:h-72 shadow-lg mb-5 bg-gray-200 animate-pulse rounded-md" />
            ))
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-8">Error al cargar el catálogo.</div>
          ) : filteredPrendas.length === 0 ? (
            <div className="col-span-full text-center text-texto py-8">
              No se encontraron productos.{" "}
              {busqueda ? <button onClick={clearBusqueda} className="underline">Limpiar búsqueda</button> : null}
            </div>
          ) : (
            filteredPrendas.map((prenda) => (
              <article
                key={prenda.id}
                onClick={() => clickPrenda(prenda.id)}
                className="h-64 lg:h-72 shadow-lg mb-5 bg-white rounded-md overflow-hidden cursor-pointer"
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
                    <p className="font-playfair text-md text-biege font-bold truncate">${prenda.precio}</p>
                    <p className="font-playfair text-sm text-texto truncate">{prenda.talla}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </main>
      </div>

      {/* Botón flotante WhatsApp */}
      <a
        href="https://wa.me/5615967613?text=Hola,%20necesito%20ayuda%20con%20el%20cat%C3%A1logo"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackWhatsappClick(
            { id: "ayuda", nombre: "Ayuda general", categoria: "Soporte", precio: 0 },
            "5615967613",
            "https://wa.me/5615967613?text=Hola,%20necesito%20ayuda%20con%20el%20cat%C3%A1logo"
          )
        }
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-[#25D366] text-white font-bold px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-transform ${
          nudge ? "animate-bounce" : ""
        }`}
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
        <span className="hidden sm:inline">¿Necesitas ayuda?</span>
      </a>
    </div>
  );
}

export default App;
