// Hero section principal
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { FaArrowRight } from 'react-icons/fa';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/4 -right-1/4 w-96 h-96 bg-primary-300 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-secondary-300 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-block"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                Nueva Colección 2026
              </span>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight"
            >
              Expresa tu
              <span className="block text-primary-600">Esencia</span>
            </motion.h1>

            {/* Descripción */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0"
            >
              Descubre prendas únicas que cuentan tu historia. Elegancia, 
              comodidad y estilo en cada diseño.
            </motion.p>

            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                as={Link}
                to="/catalogo"
                variant="primary"
                size="lg"
                icon={<FaArrowRight />}
                iconPosition="right"
              >
                Ver Catálogo
              </Button>
              <Button
                as={Link}
                to="/catalogo?ofertas=true"
                variant="outline"
                size="lg"
              >
                Ver Ofertas
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center gap-8 justify-center lg:justify-start pt-8"
            >
              <div>
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div>
                <p className="text-3xl font-bold text-gray-900">2K+</p>
                <p className="text-sm text-gray-600">Clientas Felices</p>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div>
                <p className="text-3xl font-bold text-gray-900">4.9</p>
                <p className="text-sm text-gray-600">Calificación</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Imágenes decorativas */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Imagen principal */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="relative z-10"
              >
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-large">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800"
                    alt="Moda femenina"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Imagen secundaria flotante */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-12 -left-12 w-64 h-64"
              >
                <div className="aspect-square rounded-3xl overflow-hidden shadow-large">
                  <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"
                    alt="Detalle de moda"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Badge flotante */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-medium p-6"
              >
                
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 1,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs uppercase tracking-wider">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gray-400 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
