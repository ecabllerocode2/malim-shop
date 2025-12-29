// Componente para renderizar mensajes del asistente con detección de productos
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductRecommendationCard from './ProductRecommendationCard';
import { db } from '../../credenciales';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const MessageWithProducts = ({ content, mode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Solo buscar productos si está en modo recomendación
    if (mode === 'recommendation') {
      extractAndFetchProducts();
    }
  }, [content, mode]);

  /**
   * Extraer SKUs de la respuesta
   * Soporta caracteres especiales como acentos: MAL-SUÉ-SUÉ-YJOLS
   */
  const extractSKUs = (text) => {
    const skuPatterns = [
      // SKU: MAL-SUÉ-SUÉ-YJOLS o SKU:MAL-001
      /SKU:\s*([A-ZÀ-ÿ0-9-]+)/gi,
      // /producto/MAL-001
      /producto\/([A-ZÀ-ÿ0-9-]+)/gi,
      // Patrón general: XX-XXX (2-3 letras - dígitos)
      /\b([A-ZÀ-ÿ]{2,3}-[A-ZÀ-ÿ0-9]{3,})\b/g
    ];
    
    const skus = new Set();
    skuPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Limpiar espacios extras
        const sku = match[1].trim();
        if (sku) skus.add(sku);
      }
    });
    
    console.log('🔍 SKUs detectados:', Array.from(skus));
    return Array.from(skus);
  };

  /**
   * Obtener productos desde Firestore usando los IDs de documento (SKUs)
   */
  const extractAndFetchProducts = async () => {
    const skus = extractSKUs(content);
    
    if (skus.length === 0) {
      console.log('⚠️ No se detectaron SKUs en el mensaje');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📦 Buscando productos con SKUs:', skus);
      
      // En Firestore, el SKU ES el ID del documento
      // Obtener cada documento directamente por su ID
      const fetchedProducts = [];
      
      for (const sku of skus.slice(0, 10)) { // Máximo 10 productos
        try {
          const docRef = doc(db, 'productos_public', sku);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Solo agregar si está publicado online
            if (data.publishOnline === true) {
              fetchedProducts.push({
                sku: docSnap.id,
                name: data.name,
                price: data.publicPrice,
                offer: data.offerPercentage || 0,
                category: data.category,
                image: data.mainImage || data.variants?.[0]?.images?.[0] || null,
                colors: data.variants?.map(v => v.colorName).filter(Boolean) || [],
                description: data.shortDetails || ''
              });
              console.log(`✅ Producto encontrado: ${data.name} (${sku})`);
            } else {
              console.log(`⚠️ Producto ${sku} no está publicado online`);
            }
          } else {
            console.log(`❌ Producto ${sku} no existe en Firestore`);
          }
        } catch (error) {
          console.error(`Error al obtener producto ${sku}:`, error);
        }
      }
      
      console.log(`🎉 Total de productos encontrados: ${fetchedProducts.length}`);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatear mensaje para mostrar enlaces clickeables
   */
  const formatMessage = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // No mostrar el enlace si ya tenemos cards de productos
        if (products.length > 0 && part.includes('/producto/')) {
          return null;
        }
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 underline hover:text-pink-700 font-medium"
          >
            Ver producto
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Limpiar el mensaje de URLs si hay productos
  const cleanMessage = products.length > 0
    ? content.replace(/https?:\/\/[^\s]+/g, '').trim()
    : content;

  return (
    <div className="space-y-3">
      {/* Texto del mensaje */}
      <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
        {formatMessage(cleanMessage)}
      </div>

      {/* Grid de productos recomendados */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t-2 border-pink-100"
        >
          {products.map((product, index) => (
            <ProductRecommendationCard
              key={product.sku}
              product={product}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {/* Loading de productos */}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
        </div>
      )}
    </div>
  );
};

export default MessageWithProducts;
