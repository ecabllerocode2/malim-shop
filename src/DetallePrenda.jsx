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

function DetallePrenda() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { getProductById, fetchProductById, products } = useProducts();

  // Leer parámetro foto de la URL (índice de imagen)
  const queryParams = new URLSearchParams(location.search);
  const fotoInicial = parseInt(queryParams.get("foto")) || 0;

  const [datos, setDatos] = useState({});
  const [fotoActualIndex, setFotoActualIndex] = useState(fotoInicial);
  const [fotoActual, setFotoActual] = useState("");

  useEffect(() => {
    let mounted = true;
    const local = getProductById(id);
    if (local) {
      setDatos(local);
      if (local.fotos && local.fotos.length > 0) {
        // Ajustar fotoInicial para que no se salga de rango
        const inicial = fotoInicial < local.fotos.length ? fotoInicial : 0;
        setFotoActual(local.fotos[inicial]);
        setFotoActualIndex(inicial);
      }
    } else {
      fetchProductById(id)
        .then((p) => {
          if (!mounted) return;
          setDatos(p);
          if (p.fotos && p.fotos.length > 0) {
            const inicial = fotoInicial < p.fotos.length ? fotoInicial : 0;
            setFotoActual(p.fotos[inicial]);
            setFotoActualIndex(inicial);
          }
        })
        .catch(() => {
          if (!mounted) return;
          alert("Error al cargar el producto");
        });
    }
    return () => {
      mounted = false;
    };
  }, [id, getProductById, fetchProductById, fotoInicial]);

  const categoriaFilter = () => {
    if (!datos.categoria) return [];
    return (products || []).filter(
      (p) => p.categoria === datos.categoria && p.id !== id
    );
  };

  const enviarWhatsapp = () => {
    const baseUrl = window.location.origin;
    const productoUrl = `${baseUrl}/detallePrenda/${id}?foto=${fotoActualIndex}`;

    const mensaje = `Hola, estoy interesada en este producto:\n${datos.prenda}\n\n${productoUrl}`;

    window.open(`https://wa.me/5615967613?text=${encodeURIComponent(mensaje)}`);
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
              const fotoActiva = datos.fotos[swiper.activeIndex];
              setFotoActual(fotoActiva);
            }}
          >
            {datos.fotos.map((foto, i) => (
              <SwiperSlide key={i}>
                <img
                  loading="lazy"
                  src={foto}
                  alt={`${datos.prenda} - imagen ${i + 1}`}
                  className="w-full max-h-[70vh] object-contain"
                  style={{ margin: "0 auto" }}
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

          <div className="flex justify-center">
            <button
              onClick={enviarWhatsapp}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold text-md hover:bg-[#1ebe57] transition-colors duration-200"
            >
              <FaWhatsapp className="text-lg" />
              Consulta por WhatsApp
            </button>
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
                <p className="font-montserrat w-full text-xs text-texto w-1/2">{prenda.prenda}</p>
                <p className="font-montserrat w-full text-end text-sm w-1/2 text-biege font-bold">${prenda.precio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DetallePrenda;
