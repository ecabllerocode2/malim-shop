// src/App.jsx
import logo from "./logo.png";
import React, { useEffect, useState, useMemo, useLayoutEffect, useRef } from "react";
import { FaSearch, FaWhatsapp, FaTimes } from "react-icons/fa";
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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todo");
  const [busqueda, setBusqueda] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [nudge, setNudge] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], loading, error } = useProducts();
  const headerRef = useRef(null);

  // GA init
  useEffect(() => initGA("G-9DD5YEX28R"), []);
  useEffect(() => pageView(location.pathname, document.title), [location.pathname]);

  // PWA install
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      toast[outcome === "accepted" ? "success" : "info"](outcome === "accepted" ? "App instalada" : "Instalación cancelada");
      setShowInstallButton(false);
    } catch (err) {
      toast.error("Error en la instalación");
    } finally {
      setDeferredPrompt(null);
    }
  };

  // Firebase Messaging
  useEffect(() => {
    generateToken();
    try {
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "Notificación";
        const body = payload.notification?.body || "";
        toast.info(`${title}${body ? ` — ${body}` : ""}`);
      });
    } catch (e) {
      console.warn("onMessage error:", e);
    }
  }, []);

  // Categorías
  const categoriasConfig = {
    Todo: () => true,
    Premium: (p) => p.proveedor === "Aspik",
    Invierno: (p) =>
      ["Ensambles", "Abrigos", "Chamarras", "Mallones", "Sudaderas", "Capas", "Maxi sudaderas", "Gorros", "Maxi cobijas", "Chalecos", "Suéteres"].includes(p.categoria),
    Casual: (p) =>
      ["Blusones", "Pijamas", "Blazers", "Faldas", "Palazzos", "Blusas", "Gabardinas", "Playeras", "Sacos", "Chalecos", "Conjuntos", "Maxi vestidos", "Camisas", "Medias"].includes(p.categoria),
    Deporte: (p) => ["Playeras deportivas", "Leggins", "Conjuntos deportivos", "Pants", "Shorts"].includes(p.categoria),
    Infantil: (p) => ["Infantil niño", "Infantil niña", "Niños unisex", "Niños uisex"].includes(p.categoria),
    Pantalones: (p) => ["Pantalones", "Leggins", "Overoles"].includes(p.categoria),
    // Aseguramos que la oferta sea > 0
    Ofertas: (prenda) => prenda.oferta && prenda.oferta > 0,
  };

  const filteredPrendas = useMemo(() => {
    const filterFn = categoriasConfig[categoriaSeleccionada] ?? categoriasConfig.Todo;
    let listado = (products || []).filter(filterFn);
    if (busqueda) {
      const term = busqueda.toLowerCase();
      listado = listado.filter((p) => (p.prenda || "").toLowerCase().includes(term));
    }
    return listado;
  }, [products, categoriaSeleccionada, busqueda]);

  useEffect(() => {
    if (busqueda.trim()) trackSearch(busqueda.trim(), filteredPrendas.length);
  }, [busqueda, filteredPrendas.length]);

  const clickPrenda = (id) => {
    const prenda = products.find((p) => p.id === id);
    if (prenda) {
      trackSelectItem({ id: prenda.id, nombre: prenda.prenda, categoria: prenda.categoria });
    }
    navigate(`/detallePrenda/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearBusqueda = () => setBusqueda("");

  const enviarWhatsapp = (e, prenda) => {
    e.stopPropagation();
    const foto = prenda.fotos?.[0] ?? "";
    const mensaje = `Hola, estoy interesada en este producto:\n${prenda.prenda}${foto ? `\n${foto}` : ""}`;
    const waUrl = `https://wa.me/5615967613?text=${encodeURIComponent(mensaje)}`;
    trackWhatsappClick({ id: prenda.id, nombre: prenda.prenda, categoria: prenda.categoria, precio: prenda.precio }, "5615967613", waUrl);
  };

  // Medir altura del header
  const measureHeader = () => setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
  useLayoutEffect(measureHeader, [categoriaSeleccionada]);
  useEffect(() => {
    const obs = new ResizeObserver(measureHeader);
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  // WhatsApp nudge
  useEffect(() => {
    const interval = setInterval(() => {
      setNudge(true);
      setTimeout(() => setNudge(false), 1200);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // === Renderizado ===
  const categoriasVisibles = ["Todo", "Premium", "Invierno", "Casual", "Deporte", "Pantalones", "Ofertas"];

  const prendasEnOferta = useMemo(() => {
    return (products || []).filter(p => p.oferta && p.oferta > 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-gris">
      <ToastContainer position="bottom-right" />

      {/* Botón de instalación PWA */}
      {showInstallButton && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-biege border-2 border-titulo rounded-full text-texto font-bold shadow-lg hover:bg-opacity-90 transition"
          >
            Instalar App
          </button>
        </div>
      )}

      {/* Header fijo */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-biege shadow-sm"
      >
        <div className="flex justify-center items-center h-16 border-b border-gray-200">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </div>

        {/* Navegación por categorías */}
        <nav className="overflow-x-auto scrollbar-hide py-2 px-4">
          <div className="flex space-x-4 min-w-max">
            {categoriasVisibles.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoria(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition ${categoriaSeleccionada === cat
                    ? "bg-cobre text-white shadow"
                    : "text-texto hover:bg-gray-100"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="pt-[120px] pb-24">
        {/* Hero Banner */}
        <div className="relative w-full h-64 sm:h-80 overflow-hidden">
          <img
            src="/banners/hero.jpg"
            alt="Ofertas destacadas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold text-center px-4 drop-shadow">
              Descubre tu estilo
            </h1>
          </div>
        </div>

        {/* Sección destacada: Ofertas */}
        {prendasEnOferta.length > 0 && (
          <section className="px-4 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-texto font-playfair">🔥 Ofertas del momento</h2>
              <button
                onClick={() => handleCategoria("Ofertas")}
                className="text-cobre text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {prendasEnOferta.slice(0, 5).map((prenda) => {
                const precioFinal = Math.round(prenda.precio * (1 - prenda.oferta / 100));
                return (
                  <article
                    key={prenda.id}
                    onClick={() => clickPrenda(prenda.id)}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        loading="lazy"
                        src={prenda.fotos?.[0] ?? logo}
                        alt={prenda.prenda}
                        className="w-full h-40 object-cover"
                      />
                      {/* Aquí prenda.oferta > 0 ya está implícito en prendasEnOferta */}
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{prenda.oferta}%
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="font-playfair font-bold text-texto text-xs truncate">
                        {prenda.prenda}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-biege font-bold text-sm">${precioFinal}</span>
                        <span className="text-gray-500 line-through text-xs">${prenda.precio}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Barra de búsqueda */}
        <div className="px-4 mt-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-biege">
              <FaSearch />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar prendas, categorías..."
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-cobre focus:border-transparent"
            />
            {busqueda && (
              <button
                onClick={clearBusqueda}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-8 px-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">Error al cargar productos.</div>
          ) : filteredPrendas.length === 0 ? (
            <div className="text-center py-12 text-texto">
              No se encontraron productos.
              {busqueda && (
                <button onClick={clearBusqueda} className="ml-2 text-cobre underline">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {filteredPrendas.map((prenda) => {
                // ⭐ CORRECCIÓN CLAVE: Esto asegura que 'tieneOferta' es un booleano, no 0.
                const tieneOferta = !!(prenda.oferta && prenda.oferta > 0); 
                const precioFinal = tieneOferta ? Math.round(prenda.precio * (1 - prenda.oferta / 100)) : prenda.precio;

                return (
                  <article
                    key={prenda.id}
                    onClick={() => clickPrenda(prenda.id)}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        loading="lazy"
                        src={prenda.fotos?.[0] ?? logo}
                        alt={prenda.prenda}
                        className="w-full h-48 object-cover"
                      />
                      {/* ⭐ CORRECCIÓN DE RENDERIZADO: Utilizamos el booleano 'tieneOferta' */}
                      {tieneOferta && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{prenda.oferta}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-playfair font-bold text-texto text-sm truncate mb-1">
                        {prenda.prenda}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {tieneOferta ? (
                            <>
                              <span className="text-biege font-bold text-md">${precioFinal}</span>
                              <span className="text-gray-500 line-through text-xs">${prenda.precio}</span>
                            </>
                          ) : (
                            // Si no hay oferta, solo se imprime el precio (que nunca es 0)
                            <span className="text-biege font-bold text-md">${prenda.precio}</span>
                          )}
                        </div>
                        <span className="text-texto text-xs">{prenda.talla}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform ${nudge ? "animate-bounce" : ""
          }`}
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </a>
    </div>
  );
}

export default App;