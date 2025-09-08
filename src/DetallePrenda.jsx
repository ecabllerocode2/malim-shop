import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { Pagination } from "swiper/modules";
import "swiper/css/pagination";
import { IoMdHome } from "react-icons/io";
import logo from "./logo.png";
import { useProducts } from "./contexts/ProductsContext";
import { FaWhatsapp } from "react-icons/fa";
import { trackViewItem, trackWhatsappClick } from "./analytics";

function DetallePrenda() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { getProductById, fetchProductById, products } = useProducts();

  const queryParams = new URLSearchParams(location.search);
  const fotoInicial = parseInt(queryParams.get("foto")) || 0;

  const [datos, setDatos] = useState({});
  const [fotoActualIndex, setFotoActualIndex] = useState(fotoInicial);
  const [fotoActual, setFotoActual] = useState("");
  const [nudge, setNudge] = useState(true);

  useEffect(() => {
    let mounted = true;
    const local = getProductById(id);
    const setProductData = (p) => {
      setDatos(p);
      if (p.fotos && p.fotos.length > 0) {
        const inicial = fotoInicial < p.fotos.length ? fotoInicial : 0;
        setFotoActual(p.fotos[inicial]);
        setFotoActualIndex(inicial);
      }
    };

    if (local) {
      setProductData(local);
    } else {
      fetchProductById(id).then((p) => mounted && setProductData(p));
    }

    return () => {
      mounted = false;
    };
  }, [id, getProductById, fetchProductById, fotoInicial]);

  useEffect(() => {
    if (datos?.id) {
      trackViewItem({
        id: datos.id,
        nombre: datos.prenda,
        categoria: datos.categoria,
        precio: datos.precio
      });
    }
  }, [datos]);

  useEffect(() => {
    const timer = setTimeout(() => setNudge(false), 3000); // anima solo 3 segundos
    return () => clearTimeout(timer);
  }, []);

  const categoriaFilter = () => {
    if (!datos.categoria) return [];
    return (products || []).filter((p) => p.categoria === datos.categoria && p.id !== id);
  };

  const enviarWhatsapp = () => {
    const baseUrl = window.location.origin;
    const productoUrl = `${baseUrl}/detallePrenda/${id}?foto=${fotoActualIndex}`;
    const mensaje = `Hola, estoy interesada en este producto:\n${datos.prenda}\n\n${productoUrl}`;
    const waUrl = `https://wa.me/5615967613?text=${encodeURIComponent(mensaje)}`;

    trackWhatsappClick({
      id: datos.id,
      nombre: datos.prenda,
      categoria: datos.categoria,
      precio: datos.precio
    }, "5615967613", waUrl);
  };

  const home = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="lg:flex lg:flex-row">
      <div className="h-5 absolute z-10 mt-1 ml-2" onClick={home}>
        <IoMdHome className="text-2xl text-titulo" />
      </div>

      <div id="tarjeta" className="w-full lg:w-1/2 h-5/6 pt-0">
        {datos.fotos && datos.fotos.length > 0 ? (
          <Swiper
            className="w-full h-auto"
            spaceBetween={10}
            slidesPerView={1}
            pagination={{ clickable: true }}
            loop={true}
            modules={[Pagination]}
            initialSlide={fotoActualIndex}
            onSlideChange={(swiper) => {
              setFotoActualIndex(swiper.activeIndex);
              setFotoActual(datos.fotos[swiper.activeIndex]);
            }}
          >
            {datos.fotos.map((foto, i) => (
              <SwiperSlide key={i}>
                <img
                  loading="lazy"
                  src={foto}
                  alt={`${datos.prenda} - imagen ${i + 1}`}
                  className="w-full max-h-[70vh] object-contain"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex justify-center items-center">
            <img src={logo} alt="" className="text-center h-20 w-20" />
          </div>
        )}

        <div className="mx-3">
          <div className="flex flex-row font-montserrat justify-between">
            <div>
              <p className="text-titulo font-bold">{datos.prenda}</p>
              <p className="text-sm font-montserrat text-texto">{datos.detalles}</p>
            </div>
            <div className="text-texto text-sm mr-5 text-center">
              <p className="text-titulo font-bold text-lg">${datos.precio}</p>
              {datos.talla
                ? datos.talla.map((t, idx) => <p key={idx}>{t}</p>)
                : <p>Sin talla</p>}
            </div>
          </div>

          {/* Microcopy + Botón + Badge */}
          <div className="flex flex-col items-center mt-6">
            {/* Microcopy opcional (si quieres reforzar) */}
            <p className="text-xs text-center text-gris-600 mb-3 px-4">
              📱 Envía esta prenda directo a WhatsApp con un click.
            </p>

            {/* Botón con nudge */}
            <button
              onClick={enviarWhatsapp}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold hover:scale-105 active:scale-95 transform transition-all duration-200 shadow-xl hover:shadow-2xl ${nudge ? "animate-pulse" : ""
                }`}
            >
              <p className="text-xs font-medium">Click aquí para recibir info</p>
              <div className="flex flex-row items-center gap-2">
                <FaWhatsapp className="text-2xl" />
                <span className="text-lg">¡Escríbenos por WhatsApp!</span>
              </div>
            </button>

            {/* Badge de confianza */}
            <div className="mt-3 flex items-center justify-center">
              <span className="text-xs bg-white text-[#25D366] px-3 py-1 rounded-full font-bold shadow-sm">
                ✅ Respondemos en menos de 1 minuto
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-3 lg:h-auto">
        <p className="text-texto text-sm lg:text-center lg:font-bold lg:text-md">Tal vez te interese</p>
        <div className="overflow-x-auto flex scroll-smooth lg:grid lg:grid-cols-3 lg:w-full lg:gap-4">
          {categoriaFilter().map((prenda) => (
            <div
              key={prenda.id}
              onClick={() => navigate(`/detallePrenda/${prenda.id}`)}
              className="h-44 w-24 flex-shrink-0 mr-5 lg:w-full lg:h-full"
            >
              <img
                loading="lazy"
                src={prenda.fotos?.[0]}
                alt={prenda.prenda}
                className="h-4/6 w-full object-cover"
              />
              <div className="flex flex-row items-center px-1 w-full">
                <p className="font-montserrat w-full text-xs text-texto">{prenda.prenda}</p>
                <p className="font-montserrat w-full text-end text-sm text-biege font-bold">${prenda.precio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DetallePrenda;
