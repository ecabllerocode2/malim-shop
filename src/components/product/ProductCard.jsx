// Componente de tarjeta de producto para el catálogo
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Image from '../ui/Image';
import Badge from '../ui/Badge';
import { formatPrice, calculateDiscountedPrice, getMainImage } from '../../utils/format';
import { cn } from '../../utils/cn';

const ProductCard = ({ product, index = 0 }) => {
  const mainImage = getMainImage(product);
  const hasDiscount = product.offerPercentage > 0;
  const finalPrice = calculateDiscountedPrice(
    product.publicPrice,
    product.offerPercentage
  );

  // Verificar si hay stock en alguna variante
  const hasStock = product.variants?.some((variant) =>
    variant.sizes?.some((size) => size.stock > 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/producto/${product.id}`}>
        <motion.div
          className="group relative"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {/* Imagen del producto */}
          <div className="relative overflow-hidden rounded-2xl bg-neutral-100 shadow-soft group-hover:shadow-medium transition-shadow duration-300">
            <Image
              src={mainImage}
              alt={product.name}
              aspectRatio="3/4"
              className="w-full"
            />

            {/* Overlay con gradiente en hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges superiores */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {hasDiscount && (
                <Badge variant="discount" size="md">
                  -{product.offerPercentage}%
                </Badge>
              )}
              {!hasStock && (
                <Badge variant="default" size="sm">
                  Bajo Pedido
                </Badge>
              )}
            </div>

            {/* Colores disponibles (mostrar al hacer hover) */}
            {product.variants && product.variants.length > 1 && (
              <motion.div
                className="absolute bottom-3 left-3 flex gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
              >
                {product.variants.slice(0, 5).map((variant) => (
                  <div
                    key={variant.id}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: variant.hexColor }}
                    title={variant.colorName}
                  />
                ))}
                {product.variants.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                    +{product.variants.length - 5}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Información del producto */}
          <div className="mt-4 space-y-2">
            {/* Categoría */}
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              {product.category}
            </p>

            {/* Nombre */}
            <h3 className="font-playfair text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>

            {/* Descripción corta */}
            {product.shortDetails && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.shortDetails}
              </p>
            )}

            {/* Precios */}
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.publicPrice)}
                </span>
              )}
              <span className="text-xl font-bold text-primary-600">
                {formatPrice(finalPrice)}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
