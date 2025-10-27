// src/DetallePrenda.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp, FaArrowLeft } from "react-icons/fa";
import logo from "./logo.png";
import { useProducts } from "./contexts/ProductsContext"; 
import { trackViewItem, trackWhatsappClick } from "./analytics";

// Utilidad para capitalizar correctamente
const capitalizeSentences = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
};

// Extraer colores después de "TONOS:"
const extractColores = (detalles = "") => {
  const match = detalles.match(/TONOS:\s*(.*)/i);
  if (match) {
    return match[1]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return null;
};

function DetallePrenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Desestructuramos el estado de carga global y la función de carga individual
  const { products = [], loading: isContextLoading, fetchProductById } = useProducts(); 
  const [prenda, setPrenda] = useState(null);
  const [isProductLoading, setIsProductLoading] = useState(true); // Estado de carga local
  const [imagenPrincipal, setImagenPrincipal] = useState(0);

  useEffect(() => {
    let isMounted = true; 

    if (!id) {
        navigate("/", { replace: true });
        return;
    }

    const loadProduct = async () => {
        setIsProductLoading(true);

        // 1. Intentar obtener del Context/Cache (rápido)
        let found = products.find((p) => p.id === id);

        // 2. Si no se encontró, forzamos una lectura individual a Firestore
        if (!found) {
            try {
                // Intentar cargar la prenda con una lectura individual de Firestore
                found = await fetchProductById(id);
            } catch (error) {
                // Si falla (producto no existe), navegamos a la raíz y reemplazamos el historial
                if (isMounted) {
                    console.warn(`Producto ${id} no encontrado.`);
                    navigate("/", { replace: true });
                    setIsProductLoading(false);
                }
                return;
            }
        }

        // 3. Establecer el producto si se encontró
        if (found && isMounted) {
            setPrenda(found);
            setImagenPrincipal(0);
            trackViewItem({
                id: found.id,
                nombre: found.prenda,
                categoria: found.categoria,
                precio: found.precio,
            });
        }
        
        if (isMounted) setIsProductLoading(false);
    };

    loadProduct();

    return () => {
        isMounted = false;
    };
    
  }, [id, products, navigate, fetchProductById]); 

  // Muestra el spinner de carga si el producto aún no se ha resuelto
  if (isProductLoading) {
    return (
      <div className="min-h-screen bg-gris flex items-center justify-center">
        <div className="text-texto">Cargando detalles del artículo...</div>
      </div>
    );
  }

  // Si terminamos de cargar (isProductLoading=false) y prenda es null, la redirección ya ocurrió.
  if (!prenda) {
    return (
      <div className="min-h-screen bg-gris flex items-center justify-center">
          <div className="text-texto">Artículo no encontrado. Redirigiendo...</div>
      </div>
    );
  }
  
  const fotos = prenda.fotos && prenda.fotos.length > 0 ? prenda.fotos : [logo];
  // ⭐ CORRECCIÓN CLAVE: Usamos !! para forzar que sea un booleano, NO el valor 0.
  const tieneOferta = !!(prenda.oferta && prenda.oferta > 0);
  const precioFinal = tieneOferta ? Math.round(prenda.precio * (1 - prenda.oferta / 100)) : prenda.precio;
  const colores = extractColores(prenda.detalles);
  const descripcionLimpia = prenda.detalles
    ? capitalizeSentences(prenda.detalles.split(/TONOS:/i)[0].trim())
    : "";

  const mensajeWhatsApp = `Hola, estoy interesada en:\n\n"${prenda.prenda}"\nTalla: ${prenda.talla || "N/A"}\n${tieneOferta ? `Precio con ${prenda.oferta}% de descuento: $${precioFinal}` : `Precio: $${prenda.precio}`}\n\n${fotos[0]}`;
  const waUrl = `https://wa.me/5615967613?text=${encodeURIComponent(mensajeWhatsApp)}`;

  const handleWhatsAppClick = () => {
    trackWhatsappClick(
      {
        id: prenda.id,
        nombre: prenda.prenda,
        categoria: prenda.categoria,
        precio: precioFinal,
      },
      "5615967613",
      waUrl
    );
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gris pb-28">
      {/* Botón de regresar */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-20 bg-white p-2.5 rounded-full shadow-md hover:bg-gray-100"
        aria-label="Regresar"
      >
        <FaArrowLeft className="text-texto text-lg" />
      </button>

      {/* Galería principal */}
      <div className="relative w-full bg-white pt-4 px-4">
        <div className="w-full h-96 flex items-center justify-center">
          <img
            src={fotos[imagenPrincipal] || logo}
            alt={`${prenda.prenda} - Vista ${imagenPrincipal + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        
        {/* Badge de oferta (ahora en esquina superior derecha) */}
        {/* Al usar 'tieneOferta' (que ahora es true/false), garantizamos que el 0 nunca se renderiza aquí */}
        {tieneOferta && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow z-10">
            -{prenda.oferta}%
          </div>
        )}
      </div>

      {/* Miniaturas - ahora cuadradas y con object-cover */}
      {fotos.length > 1 && (
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-3 min-w-max">
            {fotos.map((foto, idx) => (
              <button
                key={idx}
                onClick={() => setImagenPrincipal(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  idx === imagenPrincipal ? "border-cobre" : "border-gray-200"
                }`}
              >
                <img
                  src={foto}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido debajo */}
      <div className="bg-white rounded-t-3xl -mt-6 pt-8 px-6 pb-8">
        <h1 className="font-playfair font-bold text-xl text-texto mb-1">{prenda.prenda}</h1>
        <p className="text-gray-600 text-sm mb-4">{prenda.categoria}</p>

        {/* Precios */}
        <div className="mb-6">
          {tieneOferta ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-biege">${precioFinal}</span>
              <span className="text-gray-500 line-through text-sm">${prenda.precio}</span>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                Ahorras ${prenda.precio - precioFinal}
              </span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-biege">${prenda.precio}</div>
          )}
        </div>

        {/* Talla */}
        {/* Aquí la talla se renderiza directamente, lo cual está bien si no puede ser 0 */}
        {prenda.talla && (
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Talla:</span> {Array.isArray(prenda.talla) ? prenda.talla.join(', ') : prenda.talla}
            </p>
          </div>
        )}

        {/* Colores (si existen) */}
        {colores && colores.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Colores disponibles:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colores.map((color, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                >
                  {color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        {descripcionLimpia && (
          <div className="mb-6">
            <h2 className="font-bold text-texto text-sm mb-2">Detalles</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{descripcionLimpia}</p>
          </div>
        )}

        {/* Botón WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:bg-[#128C7E] transition-colors"
        >
          <FaWhatsapp className="text-2xl" />
          Comprar ahora por WhatsApp
        </button>

        {/* Texto de atención al cliente - tono cálido, sin presión */}
        <p className="text-center text-gray-500 text-xs mt-4 italic">
          Estamos aquí para guiarte con cariño en cada paso. Sin presión, solo acompañamiento.
        </p>
      </div>
    </div>
  );
}

export default DetallePrenda;