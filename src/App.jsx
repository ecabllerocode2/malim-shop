import logo from "./logo.png";
import React, { useEffect, useState } from "react";
import { FaSearch, FaWhatsapp } from "react-icons/fa";
import { db, messaging } from "./credenciales";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateToken } from "./credenciales";
import { onMessage } from "firebase/messaging";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todo");
  const [prendas, setPrendas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const clickPrenda = (id) => {
    navigate(`/DetallePrenda/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    const obtenerPrendas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "disponible"));
        const arrayPrendas = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        arrayPrendas.sort((a, b) => new Date(b.fecha || "1970-01-01").getTime() - new Date(a.fecha || "1970-01-01").getTime());
        setPrendas(arrayPrendas);
      } catch (error) {
        toast.error("Error al cargar las prendas: " + error.message);
      }
    };
    obtenerPrendas();
  }, [categoriaSeleccionada]);

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
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          toast.success("App instalada");
          setShowInstallButton(false);

          
        } else {
          toast.info("Instalación cancelada");
        }
        setDeferredPrompt(null);
      } catch (error) {
        toast.error("Error en la instalación: " + error.message);
      }
    }
  };

  //UseEffect para generar token
  useEffect(() => {
    generateToken();
    onMessage(messaging, (payload) => {
      console.log(payload);
    })
  }, [])

  const filtrarPrendas = () => {
    let filtroCatgoria;
    if (categoriaSeleccionada === "Todo") {
      filtroCatgoria = prendas;
    } else if (categoriaSeleccionada === "Invierno") {
      filtroCatgoria = prendas.filter((prenda) => {
        return prenda.categoria === "Ensambles" || prenda.categoria === "Abrigos"
          || prenda.categoria === "Chamarras" || prenda.categoria === "Mallones" || prenda.categoria === "Sudaderas"
          || prenda.categoria === "Capas" || prenda.categoria === "Maxi sudaderas" || prenda.categoria === "Gorros"
          || prenda.categoria === "Maxi cobijas" || prenda.categoria === "Chalecos" || prenda.categoria === "Suéteres";
      })
    } else if (categoriaSeleccionada === "Casual") {
      filtroCatgoria = prendas.filter((prenda) => {
        return prenda.categoria === "Blusones" || prenda.categoria === "Pijamas"
          || prenda.categoria === "Blazers" || prenda.categoria === "Faldas" || prenda.categoria === "Palazzos"
          || prenda.categoria === "Blusas" || prenda.categoria === "Gabardinas" || prenda.categoria === "Playeras"
          || prenda.categoria === "Sacos" || prenda.categoria === "Chalecos" || prenda.categoria === "Conjuntos"
          || prenda.categoria === "Maxi vestidos" || prenda.categoria === "Camisas" || prenda.categoria === "Medias";
      })
    } else if (categoriaSeleccionada === "Deporte") {
      filtroCatgoria = prendas.filter((prenda) => {
        return prenda.categoria === "Playeras deportivas" || prenda.categoria === "Leggins"
          || prenda.categoria === "Conjuntos deportivos" || prenda.categoria === "Pants" || prenda.categoria === "Shorts";
      })
    } else if (categoriaSeleccionada === "Infantil") {
      filtroCatgoria = prendas.filter((prenda) => {
        return prenda.categoria === "Infantil niño" || prenda.categoria === "Infantil niña"
          || prenda.categoria === "Niños unisex" || prenda.categoria === "Niños uisex";
      })
    } else if (categoriaSeleccionada === "Pantalones") {
      filtroCatgoria = prendas.filter((prenda) => {
        return prenda.categoria === "Pantalones" || prenda.categoria === "Leggins" || prenda.categoria === "Overoles";
      })
    }

    return filtroCatgoria.filter((prenda) =>
      prenda.prenda.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const handleCategoria = (catgoria) => {
    setCategoriaSeleccionada(catgoria);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
  };

  const enviarWhatsapp = (prenda) => {
    var mensaje;
    if (!prenda.fotos) {
      mensaje = `Hola, estoy interesada en este producto:
        %0A${prenda.prenda}`;
    } else {
      mensaje = `Hola, estoy interesada en este producto:
        %0A${prenda.prenda}%0A${prenda.fotos[0]}`;
    }
    window.open(`https://wa.me/5615967613?text=${mensaje}`);
  };



  return (
    <div className='bg-gris h-screen w-full'>
      {/* Botón de instalación */}
      {showInstallButton && ( 
        <div className="mt-20 z-20 flex w-full justify-center h-20">
          <button
            id="installButton"
            onClick={handleInstallClick}
            className="w-1/4 bg-biege border-titulo border-2 rounded-xl
              text-texto font-bold font-montserrat"
          >
            Instalar
          </button>
        </div>
      )}
      <ToastContainer />
      <div id="header" className="-mt-2 fixed top-0 left-0 flex flex-col z-10 w-full justify-center bg-biege">
        <div className="flex justify-center">
          <img className="h-16 w-16" src={logo} alt="logo malim" />
        </div>
        <div id="categorias" className="bg-biege h-5 -mt-4 px-2 flex flex-row
        text-texto justify-between mb-1">
          <p onClick={() => handleCategoria("Todo")}
            className={`${categoriaSeleccionada === "Todo" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Todo</p>
          <p onClick={() => handleCategoria("Invierno")}
            className={`${categoriaSeleccionada === "Invierno" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Invierno</p>
          <p onClick={() => handleCategoria("Casual")}
            className={`${categoriaSeleccionada === "Casual" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Casual</p>
          <p onClick={() => handleCategoria("Deporte")}
            className={`${categoriaSeleccionada === "Deporte" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Deporte</p>
          <p onClick={() => handleCategoria("Infantil")}
            className={`${categoriaSeleccionada === "Infantil" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Infantil</p>
          <p onClick={() => handleCategoria("Pantalones")}
            className={`${categoriaSeleccionada === "Pantalones" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Pantalones</p>
        </div>
      </div>
      <div id="barra-busqueda" className="my-2 mt-10 pt-8 mx-5 flex flex-row">
        <FaSearch className="h-4 text-sm text-biege mt-1.5 -mr-6 z-10" />
        <input type="text" onChange={handleBusqueda} value={busqueda} placeholder="Buscar" className="bg-gris border-2 rounded-xl border-biege
        placeholder-biege text-sm h-7 pl-7 z-0 focus:outline-none text-texto font-montserrat"/>
      </div>
      <ToastContainer />
      <div id="contenedor-lista" className="mx-3 grid grid-cols-2 gap-x-10 lg:grid-cols-5">
        {(filtrarPrendas().map((prenda) => (
          <div onClick={() => clickPrenda(prenda.id)} id="tarjeta-prenda" className="h-64 lg:h-72 shadow-lg mb-5">
            <img src={prenda.fotos[0]} alt={prenda.prenda} className="w-full h-4/5" />
            <div className="flex flex-row items-center px-1 justify-between h-1/5">
              <p className="w-3/4 font-playfair text-sm text-texto">{prenda.prenda}</p>
              <FaWhatsapp onClick={() => enviarWhatsapp(prenda)} className="mr-2 text-lg text-texto" />
            </div>
          </div>
        )))}
      </div>
    </div>
  )
}

export default App
