// Componente para renderizar mensajes del asistente con detección de productos
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductRecommendationCard from './ProductRecommendationCard';
import { db } from '../../credenciales';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getMainImage } from '../../utils/format';

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

  /**
   * Convertir markdown básico a HTML (negritas)
   */
  const convertMarkdown = (text) => {
    // Convertir **texto** a <strong>texto</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  /**
   * Renderizar contenido con productos inline
   */
  const renderContentWithProducts = () => {
    console.log('🎨 Renderizando:', { mode, productsCount: products.length });
    
    if (mode !== 'recommendation' || products.length === 0) {
      // Sin productos: solo texto con markdown
      return (
        <div
          className="text-sm sm:text-base whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: convertMarkdown(content) }}
        />
      );
    }

    // Con productos: dividir y renderizar inline
    const elements = [];
    let remainingContent = content;
    
    // Para cada producto, encontrar su posición y dividir el texto
    products.forEach((product, idx) => {
      // Buscar SKU o URL en el contenido
      const skuRegex = new RegExp(`SKU:\\s*${product.sku}`, 'i');
      const urlRegex = new RegExp(`https?://[^\\s]*/producto/${product.sku}`, 'i');
      
      let splitIndex = -1;
      let matchText = '';
      
      // Buscar por SKU
      const skuMatch = remainingContent.match(skuRegex);
      if (skuMatch) {
        splitIndex = skuMatch.index + skuMatch[0].length;
        matchText = skuMatch[0];
      } else {
        // Buscar por URL
        const urlMatch = remainingContent.match(urlRegex);
        if (urlMatch) {
          splitIndex = urlMatch.index + urlMatch[0].length;
          matchText = urlMatch[0];
        }
      }
      
      if (splitIndex !== -1) {
        // Texto antes del producto (incluye la mención)
        const textBefore = remainingContent.substring(0, splitIndex);
        // Limpiar URLs del texto
        const cleanText = textBefore.replace(/https?:\/\/[^\s]+/g, '').trim();
        
        // Agregar texto
        if (cleanText) {
          elements.push(
            <div
              key={`text-${idx}`}
              className="text-sm sm:text-base whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: convertMarkdown(cleanText) }}
            />
          );
        }
        
        // Agregar tarjeta del producto
        elements.push(
          <motion.div
            key={`product-${product.sku}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="my-4"
          >
            <ProductRecommendationCard
              product={product}
              index={idx}
            />
          </motion.div>
        );
        
        // Actualizar contenido restante
        remainingContent = remainingContent.substring(splitIndex);
      }
    });
    
    // Agregar texto final si queda algo
    const finalText = remainingContent.replace(/https?:\/\/[^\s]+/g, '').trim();
    if (finalText) {
      elements.push(
        <div
          key="text-final"
          className="text-sm sm:text-base whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: convertMarkdown(finalText) }}
        />
      );
    }
    
    console.log('✅ Elementos generados:', elements.length);
    return elements;
  };

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

export default MessageWithProducts;
