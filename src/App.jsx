import logo from "./logo.png";
import { useEffect, useState } from "react";
import { FaSearch, FaWhatsapp } from "react-icons/fa";
import { db } from "./credenciales";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function App() {

  //Todo lo necesario para que aparezca la opcion de instalar pwa
  useEffect(() => {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Muestra el botón o indicador para instalar
      const installButton = document.getElementById('installButton');
      if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('App instalada');
          } else {
            console.log('Instalación cancelada');
          }
          deferredPrompt = null;
        });
      }
    });
  }, []);

  //Estado para manejar que categoria está seleccionada
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todo");
  //Estado para almacenar las prendas
  const [prendas, setPrendas] = useState([]);
  //Estado para manejar las busquedas
  const [busqueda, setBusqueda] = useState("");

  //Creamos navigate para poder navegar a otra ruta
  const navigate = useNavigate();

  //Creamos la funcion que va anavergar a otra ruta al tocar una prenda
  const clickPrenda = (id) => {
    navigate(`/DetallePrenda/${id}`);
  }

  //useEffec para cargar las prendas de la base de datos al estado
  useEffect(() => {
    const obtenerPrendas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "disponible"));
        const arrayPrendas = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        arrayPrendas.sort((a, b) => {
          const fechaA = new Date(a.fecha || "1970-01-01").getTime();
          const fechaB = new Date(b.fecha || "1970-01-01").getTime();
          return fechaB - fechaA;
        });
        setPrendas(arrayPrendas);
      } catch (error) {
        alert("Error al cargr las prendas");
      }
    }
    obtenerPrendas();
  }, [categoriaSeleccionada]);

  //Effect para filtrar por categoria
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
    )
  };

  //Funcion que cambia de categoria y lleva el scroll hacia arriba
  const handleCategoria = (catgoria) => {
    setCategoriaSeleccionada(catgoria);
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  //Funcion para manejar el input de busqueda
  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
  }

  //Funcion para pedir informacion por Whatsapp
  const enviarWhatsapp = (prenda) => {
    var mensaje;
    if (!prenda.fotos) {
      mensaje = `Hola, estoy interesada en este producto:
        %0A${prenda.prenda}`;
    } else {
      mensaje = `Hola, estoy interesada en este producto:
        %0A${prenda.prenda}%0A${prenda.fotos[0]}`;
    }
    window.open(`https://wa.me/5615967613?text=${mensaje}`)
  }



  return (
    <div className='bg-gris h-screen w-full'>
      <div id="installButton" style={{ display: 'none' }} className="mt-20 z-20 flex w-full justify-center h-20">
        <button className="w-1/4 bg-biege border-titulo border-2 rounded-xl
        text-texto font-bold font-montserrat">
          Instalar
        </button>
      </div>
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
