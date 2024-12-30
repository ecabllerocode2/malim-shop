import logo from "./logo.png";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

function App() {
  //Estado para manejar que categoria está seleccionada
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todo")


  return (
    <div className='bg-gris h-screen w-full'>
      <div id="header" className="-mt-2 flex flex-col justify-center bg-biege">
        <div className="flex justify-center">
          <img className="h-16 w-16" src={logo} alt="logo malim" />
        </div>     
        <div id="categorias" className="bg-biege h-5 -mt-4 px-2 flex flex-row
        text-texto justify-between mb-1">
          <p  onClick={() => setCategoriaSeleccionada("Todo")}
          className={`${categoriaSeleccionada === "Todo" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Todo</p>
          <p  onClick={() => setCategoriaSeleccionada("Invierno")}
          className={`${categoriaSeleccionada === "Invierno" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Invierno</p>
          <p  onClick={() => setCategoriaSeleccionada("Casual")}
          className={`${categoriaSeleccionada === "Casual" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Casual</p>
          <p  onClick={() => setCategoriaSeleccionada("Deporte")}
          className={`${categoriaSeleccionada === "Deporte" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Deporte</p>
          <p  onClick={() => setCategoriaSeleccionada("Infantil")}
          className={`${categoriaSeleccionada === "Infantil" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Infantil</p>
          <p  onClick={() => setCategoriaSeleccionada("Pantalones")}
          className={`${categoriaSeleccionada === "Pantalones" ? "border-b-2 border-cobre" : ""} font-playfair text-sm`}>Pantalones</p>
        </div>
      </div>
      <div id="barra-busqueda" className="my-2 mx-5 flex flex-row">
        <FaSearch className="h-4 text-sm text-biege mt-1.5 -mr-6 z-10"/>
        <input type="text" placeholder="Buscar" className="bg-gris border-2 rounded-xl border-biege
        placeholder-biege text-sm h-7 pl-7 z-0 focus:outline-none text-texto font-montserrat"/>
      </div>
    </div>
  )
}

export default App
