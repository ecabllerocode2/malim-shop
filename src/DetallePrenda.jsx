import React, { useEffect, useState } from "react";
import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "./credenciales";
import { SwiperSlide, Swiper } from "swiper/react";
import "swiper/swiper-bundle.css";
import logo from "./logo.png";
import { useNavigate } from "react-router-dom";
import { Pagination } from "swiper/modules";
import "swiper/css/pagination";
import { IoMdHome } from "react-icons/io";



function DetallePrenda() {

    const navigate = useNavigate();


    //Obtenemos el link desde la url
    const { id } = useParams();
    //Estado para almacenar los datos de la prenda
    const [datos, setDatos] = useState({});
    //Estado para guardar las prendas de la misma categoria
    const [prendas, setPrendas] = useState([]);
    //Estado para almacenar la foto actual
    const [fotoActual, setFotoActual] = useState("");

    useEffect(() => {
        const fetchPrenda = async () => {
            try {
                const prendaRef = doc(db, "disponible", id);
                const prenda = await getDoc(prendaRef);
                if (prenda.exists()) {
                    const data = prenda.data();
                    setDatos(data);
                    if (data.fotos && data.fotos.length > 0) {
                        setFotoActual(data.fotos[0]);
                    }
                }
            } catch (error) {
                alert("Eror al cargar los datos")
            }
        }
        fetchPrenda();
    }, [id]);

    //UseEffect para guardar en el estado las prendas de la misma categoria que la prenda vista
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
                })
                setPrendas(arrayPrendas);
            } catch (error) {
                alert("Error al cargr las prendas");
            }
        }
        obtenerPrendas();
    }, []);

    const categoriaFilter = () => {
        return prendas.filter((prenda) => {
            return prenda.categoria === datos.categoria;
        })
    }

    const clickPrenda = (id) => {
        navigate(`/DetallePrenda/${id}`);
        window.scrollTo({ top: 0, behavior: "smooth" });

    }

    //Funcion para regresar a home
    const home = () => {
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });

    }

    //UNCION PARA PEDIR INFO POR WHATSAPP
    const enviarWhatsapp = () => {
        var mensaje;
        if (!datos.fotos) {
            mensaje = `Hola, estoy interesada en este producto:
          %0A${datos.prenda}`;
        } else {
            mensaje = `Hola, estoy interesada en este producto:
          %0A${datos.prenda}%0A${fotoActual}`;
        }
        window.open(`https://wa.me/5615967613?text=${mensaje}`)
    }



    return (
        <div className="lg:flex lg:flex-row">
            <div className="h-5 absolute z-10 mt-1 ml-2" onClick={home}>
                <IoMdHome className="text-2xl text-titulo"/>
            </div>
            <div id="tarjeta" className="w-full lg:w-1/2 h-5/6 pt-0">
                {datos.fotos && datos.fotos.length > 0 ? (
                    <Swiper className="w-full h-auto"
                        spaceBetween={10}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        loop={true}
                        modules={[Pagination]}
                        onSlideChange={(swiper) => {
                            const fotoActiva = datos.fotos[swiper.activeIndex];
                            setFotoActual(fotoActiva);
                        }}>
                        {datos.fotos.map((foto) => (
                            <SwiperSlide>
                                <img src={foto} alt="" className="w-full h-full" />
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
                            {datos.talla ? (
                                datos.talla.map((talla) => (
                                    <p>{talla}</p>
                                ))
                            ) : (<p>Sin talla</p>)}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={enviarWhatsapp}
                            className="font-bold text-md bg-titulo
                    text-white px-4 py-2 rounded-xl">Comprar</button>
                    </div>
                </div>
            </div>
            <div className="mx-3 lg:h-auto">
                <p className="text-texto text-sm lg:text-center lg:font-bold lg:text-md">Tal vez te interese</p>
                <div className="overflow-x-auto flex scroll-smooth lg:grid lg:grid-cols-3 lg:w-full lg:gap-4">
                    {categoriaFilter().map((prenda) => (
                        <div onClick={() => clickPrenda(prenda.id)} id="tarjeta-prenda" className="h-44
                         w-24 flex-shrink-0 mr-5 lg:w-full lg:h-full">
                            <img src={prenda.fotos[0]} alt={prenda.prenda} className="h-4/6 w-full" />
                            <div className="flex flex-row items-center px-1">
                                <p className="font-montserrat w-full text-xs text-texto">{prenda.prenda}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DetallePrenda;