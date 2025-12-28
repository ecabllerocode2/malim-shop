// Página de detalle de producto con UX premium
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../credenciales';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import { 
  FaWhatsapp, 
  FaHeart, 
  FaRegHeart,
  FaShareAlt,
  FaCheck
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatPrice, calculateDiscountedPrice } from '../utils/format';
import { cn } from '../utils/cn';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const docRef = doc(db, 'productos_public', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        
        if (!data.publishOnline) {
          navigate('/404');
          return;
        }

        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } else {
        navigate('/404');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setSelectedSize(null);
    setThumbsSwiper(null); // Reset thumbs swiper cuando cambia variante
  };

  const handleWhatsAppContact = () => {
    if (!selectedVariant) {
      toast.warning('Por favor selecciona un color');
      return;
    }

    // Generar SKU si existe una talla seleccionada
    const sku = selectedSize?.variantSku || `${product.id}-${selectedVariant.id}${selectedSize ? `-${selectedSize.size}` : ''}`;

    const message = `¡Hola! Me interesa el siguiente producto:

📦 *${product.name}*
🎨 Color: ${selectedVariant.colorName}
${selectedSize ? `📏 Talla: ${selectedSize.size}` : ''}
💰 Precio: ${formatPrice(calculateDiscountedPrice(product.publicPrice, product.offerPercentage))}
🔖 SKU: ${sku}

¿Está disponible?`;

    const url = `https://wa.me/5215615967613?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return null;
  }

  const finalPrice = calculateDiscountedPrice(
    product.publicPrice,
    product.offerPercentage
  );
  const hasDiscount = product.offerPercentage > 0;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galería de imágenes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 min-w-0"
          >
            {/* Contenedor con aspecto fijo */}
            <div className="relative rounded-3xl overflow-hidden bg-neutral-100 shadow-soft aspect-[3/4] w-full">
              <Swiper
                key={`main-${selectedVariant.id}`}
                modules={[Navigation, Pagination, Thumbs, Zoom]}
                navigation
                pagination={{ clickable: true }}
                thumbs={thumbsSwiper && !thumbsSwiper.destroyed ? { swiper: thumbsSwiper } : undefined}
                zoom
                observer={true}
                observeParents={true}
                className="absolute inset-0 w-full h-full"
              >
                {selectedVariant.imageUrls.map((url, index) => (
                  <SwiperSlide key={index}>
                    <div className="swiper-zoom-container">
                      <img
                        src={url}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Badges flotantes */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge variant="discount" size="lg">
                    -{product.offerPercentage}%
                  </Badge>
                )}
              </div>

              {/* Botón de favorito */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 left-4 z-20 w-12 h-12 bg-white rounded-full shadow-medium flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {isFavorite ? (
                  <FaHeart className="w-6 h-6" />
                ) : (
                  <FaRegHeart className="w-6 h-6" />
                )}
              </motion.button>
            </div>

            {/* Miniaturas - Solo mostrar si hay más de una imagen */}
            {selectedVariant.imageUrls && selectedVariant.imageUrls.length > 1 && (
              <div className="w-full overflow-hidden">
                <Swiper
                  key={`thumbs-${selectedVariant.id}`}
                  onSwiper={setThumbsSwiper}
                  modules={[Thumbs]}
                  spaceBetween={8}
                  slidesPerView={3}
                  breakpoints={{
                    640: { slidesPerView: 4, spaceBetween: 12 }
                  }}
                  watchSlidesProgress
                  className="thumbs-swiper"
                >
                  {selectedVariant.imageUrls.map((url, index) => (
                    <SwiperSlide key={index}>
                      <div className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all">
                        <img
                          src={url}
                          alt={`Thumb ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
          </motion.div>

          {/* Información del producto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Categoría */}
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">
                {product.category}
              </p>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
            </div>

            {/* Precio */}
            <div className="flex items-center gap-4">
              {hasDiscount && (
                <span className="text-2xl text-gray-400 line-through">
                  {formatPrice(product.publicPrice)}
                </span>
              )}
              <span className="text-4xl font-bold text-primary-600">
                {formatPrice(finalPrice)}
              </span>
            </div>

            {/* Descripción corta */}
            {product.shortDetails && (
              <p className="text-lg text-gray-700 leading-relaxed">
                {product.shortDetails}
              </p>
            )}

            {/* Selector de colores */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Color: <span className="text-primary-600">{selectedVariant.colorName}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.variants?.map((variant) => (
                  <motion.button
                    key={variant.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVariantChange(variant)}
                    className={cn(
                      'relative w-12 h-12 rounded-full border-2 transition-all shadow-sm',
                      selectedVariant?.id === variant.id
                        ? 'border-primary-600 ring-4 ring-primary-100'
                        : 'border-gray-300 hover:border-primary-400'
                    )}
                    style={{ backgroundColor: variant.hexColor }}
                    title={variant.colorName}
                  >
                    {selectedVariant?.id === variant.id && (
                      <FaCheck className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selector de tallas */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Talla: {selectedSize && <span className="text-primary-600">{selectedSize.size}</span>}
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {selectedVariant.sizes.map((size) => {
                  const isSelected = selectedSize?.variantSku === size.variantSku;

                  return (
                    <motion.button
                      key={size.variantSku}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-4 py-3 rounded-xl font-semibold transition-all',
                        isSelected
                          ? 'bg-primary-600 text-white shadow-soft'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      )}
                    >
                      {size.size}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3 pt-4">
              <Button
                variant="success"
                size="lg"
                fullWidth
                icon={<FaWhatsapp />}
                iconPosition="left"
                onClick={handleWhatsAppContact}
              >
                Comprar por WhatsApp
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  icon={<FaShareAlt />}
                  onClick={() => {
                    navigator.share?.({
                      title: product.name,
                      text: product.shortDetails,
                      url: window.location.href,
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Enlace copiado');
                    });
                  }}
                >
                  Compartir
                </Button>
              </div>
            </div>

            {/* Descripción larga */}
            {product.longDescription && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg mb-3">
                  Descripción
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.longDescription}
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <div className="text-2xl">🚚</div>
                <div>
                  <p className="font-semibold text-sm">Envío Gratis</p>
                  <p className="text-xs text-gray-600">En compras +$900</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <div className="text-2xl">↩️</div>
                <div>
                  <p className="font-semibold text-sm">Devolución</p>
                  <p className="text-xs text-gray-600">30 días gratis</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
