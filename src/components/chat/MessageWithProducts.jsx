// Componente para renderizar mensajes del asistente con detección de productos
import { useState, useEffect } from 'react';
import ProductRecommendationCard from './ProductRecommendationCard';
import { db } from '../../credenciales';
import { doc, getDoc } from 'firebase/firestore';
import { getMainImage } from '../../utils/format';
import PropTypes from 'prop-types';

const MessageWithProducts = ({ content, mode, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // Extraer SKUs de la respuesta
    const extractSKUs = (text) => {
      const skuPatterns = [
        /SKU:\s*([A-ZÀ-ÿ0-9-]+)/gi,
        /producto\/([A-ZÀ-ÿ0-9-]+)/gi,
        /\b([A-ZÀ-ÿ]{2,3}-[A-ZÀ-ÿ0-9]{3,})\b/g
      ];
      const skus = new Set();
      skuPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const sku = match[1].trim();
          if (sku) skus.add(sku);
        }
      });
      console.log('🔍 SKUs detectados:', Array.from(skus));
      return Array.from(skus);
    };

    // Obtener productos desde Firestore usando los IDs de documento (SKUs)
    const extractAndFetchProducts = async () => {
      const skus = extractSKUs(content);
      if (skus.length === 0) {
        console.log('⚠️ No se detectaron SKUs en el mensaje');
        return;
      }
      setLoading(true);
      try {
        console.log('📦 Buscando productos con SKUs:', skus);
        const fetchedProducts = [];
        for (const sku of skus.slice(0, 10)) {
          try {
            const docRef = doc(db, 'productos_public', sku);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.publishOnline === true) {
                const mainImage = getMainImage(data);
                fetchedProducts.push({
                  sku: docSnap.id,
                  name: data.name,
                  price: data.publicPrice,
                  offer: data.offerPercentage || 0,
                  category: data.category,
                  image: mainImage || '/logo.png',
                  colors: data.variants?.map(v => v.colorName).filter(Boolean) || [],
                  description: data.shortDetails || '',
                  variants: data.variants || []
                });
                console.log(`✅ Producto encontrado: ${data.name} (${sku}), imagen:`, mainImage);
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

    if (mode === 'recommendation') {
      extractAndFetchProducts();
    }
  }, [content, mode]);


  /**
   * Convertir markdown básico a HTML (negritas)
   */
  const convertMarkdown = (text) => {
    // Convertir **texto** a <strong>texto</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  /**
   * Renderiza el contenido y los productos
   */
  const renderContentWithProducts = () => (
    <>
      {/* Texto antes de los productos */}
      <div className="text-sm sm:text-base whitespace-pre-wrap break-words mb-2" dangerouslySetInnerHTML={{ __html: convertMarkdown(content) }} />
      {/* Tarjetas de productos en fila */}
      <div className="flex flex-row gap-3 overflow-x-auto py-2">
        {products.map((product, idx) => (
          <ProductRecommendationCard key={product.sku} product={product} index={idx} onProductClick={onProductClick} />
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-3">
      {renderContentWithProducts()}
      {/* Loading de productos */}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
        </div>
      )}
    </div>
  );
};


MessageWithProducts.propTypes = {
  content: PropTypes.string.isRequired,
  mode: PropTypes.string,
  onProductClick: PropTypes.func
};

export default MessageWithProducts;
