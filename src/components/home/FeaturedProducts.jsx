// Sección de productos destacados
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useProducts } from '../../contexts/ProductsContext';
import ProductCard from '../product/ProductCard';
import { ProductGridSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import { FaArrowRight } from 'react-icons/fa';

const FeaturedProducts = ({ title = 'Productos Destacados', limit = 8 }) => {
  const { products, loading } = useProducts();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Filtrar productos destacados (puedes agregar un campo "featured" en Firebase)
  const featuredProducts = products.slice(0, limit);

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-white to-neutral-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selección especial de nuestras piezas más amadas
          </p>
        </motion.div>

        {/* Grid de productos */}
        {loading ? (
          <ProductGridSkeleton count={limit} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {/* Botón ver más */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            as={Link}
            to="/catalogo"
            variant="outline"
            size="lg"
            icon={<FaArrowRight />}
            iconPosition="right"
          >
            Ver Todo el Catálogo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
