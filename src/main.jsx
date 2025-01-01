import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import DetallePrenda from './DetallePrenda.jsx'

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}/>
        <Route path='DetallePrenda/:id' element={<DetallePrenda />}/>
      </Routes>
    </BrowserRouter>
  </StrictMode>

)
