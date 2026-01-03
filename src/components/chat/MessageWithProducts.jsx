// Componente para renderizar mensajes del asistente con detección de productos
import { useState, useEffect } from 'react';
import ProductRecommendationCard from './ProductRecommendationCard';
import { getMainImage } from '../../utils/format';
import { useProducts } from '../../contexts/ProductsContext';
import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';

const MessageWithProducts = ({ content, mode, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getProductById, fetchProductsByIds } = useProducts();

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

    // Obtener productos reutilizando cache del context y haciendo batch fetch para faltantes
    const extractAndFetchProducts = async () => {
      const skus = extractSKUs(content).slice(0, 50); // limite razonable
      if (skus.length === 0) {
        console.log('⚠️ No se detectaron SKUs en el mensaje');
        return;
      }
      setLoading(true);
      try {
        const results = [];
        const missing = [];
        for (const sku of skus) {
          const cached = getProductById(sku);
          if (cached) {
            if (cached.publishOnline) results.push(cached);
          } else {
            missing.push(sku);
          }
        }

        if (missing.length > 0) {
          const fetched = await fetchProductsByIds(missing);
          fetched.forEach(p => { if (p && p.publishOnline) results.push(p); });
        }

        const mapped = results.slice(0, 10).map(p => ({
          sku: p.id,
          name: p.name,
          price: p.publicPrice,
          offer: p.offerPercentage || 0,
          category: p.category,
          image: getMainImage(p) || '/logo.png',
          colors: p.variants?.map(v => v.colorName).filter(Boolean) || [],
          description: p.shortDetails || '',
          variants: p.variants || []
        }));
        setProducts(mapped);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'recommendation') {
      extractAndFetchProducts();
    }
  }, [content, mode, fetchProductsByIds, getProductById]);


  /**
   * Convertir markdown básico a HTML (negritas)
   */
  const convertMarkdown = (text) => {
    // Convertir **texto** a <strong>texto</strong>
    const html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Sanitize HTML antes de devolver
    try {
      return typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html;
    } catch (err) {
      console.warn('convertMarkdown sanitize error:', err);
      return html;
    }
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
