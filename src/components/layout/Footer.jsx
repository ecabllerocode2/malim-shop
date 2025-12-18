// Footer del sitio
import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../../logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    shop: [
      { name: 'Catálogo', href: '/catalogo' },
      { name: 'Nuevos Productos', href: '/catalogo?filter=nuevos' },
      { name: 'Ofertas', href: '/catalogo?filter=ofertas' },
    ],
    help: [
      { name: 'Preguntas Frecuentes', href: '/faq' },
      { name: 'Envíos', href: '/envios' },
      { name: 'Devoluciones', href: '/devoluciones' },
      { name: 'Tallas', href: '/guia-tallas' },
    ],
    company: [
      { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
      { name: 'Contacto', href: '/contacto' },
      { name: 'Términos y Condiciones', href: '/terminos' },
      { name: 'Privacidad', href: '/privacidad' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Columna 1: Logo y descripción */}
          <div>
            <img src={logo} alt="Malim Logo" className="h-12 w-auto mb-4" />
            <p className="text-gray-400 mb-6">
              Moda femenina con esencia. Expresa tu autenticidad con cada prenda.
            </p>
            
            {/* Redes sociales */}
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/malim.mar1?igsh=MWQwMXYxMjduMzdy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/malim.mari.2025"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5215615967613"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <FaWhatsapp className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Columna 2: Tienda */}
          <div>
            <h4 className="font-semibold text-white text-lg mb-4">Tienda</h4>
            <ul className="space-y-2">
              {links.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Ayuda */}
          <div>
            <h4 className="font-semibold text-white text-lg mb-4">Ayuda</h4>
            <ul className="space-y-2">
              {links.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="font-semibold text-white text-lg mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                <span className="text-gray-400">
                  Ciudad de México, México
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a
                  href="mailto:hola@malim.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  hola@malim.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaWhatsapp className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a
                  href="https://wa.me/5215615967613"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  +52 1 561 596 7613
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold text-white text-lg mb-2">
              Suscríbete a nuestro newsletter
            </h4>
            <p className="text-gray-400 mb-4 text-sm">
              Recibe ofertas exclusivas y novedades
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>© {currentYear} Malim. Todos los derechos reservados.</p>
          <p className="mt-2">
            Hecho con ❤️ en México
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
