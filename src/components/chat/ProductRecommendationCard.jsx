// Componente para mostrar recomendaciones de productos en el chat
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt, FaTag, FaShoppingBag } from 'react-icons/fa';

const ProductRecommendationCard = ({ product, index }) => {
  const [imageError, setImageError] = useState(false);
  
  // Calcular precio con descuento si existe
  const finalPrice = product.offer > 0 
    ? (product.price * (1 - product.offer / 100)).toFixed(2)
    : product.price.toFixed(2);
  
  const hasDiscount = product.offer > 0;
  
  // Construir URL del producto
  const productUrl = `/producto/${product.sku}`;
  
  // URL de imagen placeholder si no hay imagen o falla
  const placeholderImage = 'https://via.placeholder.com/300x400/f472b6/ffffff?text=Malim';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 border-pink-100 hover:border-pink-300"
    >
      {/* Imagen del producto */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden group">
        <img
          src={imageError ? placeholderImage : (product.image || placeholderImage)}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Badge de descuento */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <FaTag className="w-3 h-3" />
            {product.offer}% OFF
          </div>
        )}
        
        {/* Overlay con categoría */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <span className="text-white text-xs font-medium">
            {product.category}
          </span>
        </div>
      </div>
      
      {/* Información del producto */}
      <div className="p-4">
        {/* Nombre */}
        <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {/* Precio */}
        <div className="flex items-center gap-2 mb-3">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-pink-600">
                ${finalPrice}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              ${finalPrice}
            </span>
          )}
        </div>
        
        {/* Colores disponibles (si hay) */}
        {product.colors && product.colors.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Colores:</p>
            <div className="flex gap-1 flex-wrap">
              {product.colors.slice(0, 4).map((color, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {color}
                </span>
              ))}
              {product.colors.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Botón de ver producto */}
        <a
          href={productUrl}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <FaShoppingBag className="w-4 h-4" />
          Ver Producto
          <FaExternalLinkAlt className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
};

export default ProductRecommendationCard;
