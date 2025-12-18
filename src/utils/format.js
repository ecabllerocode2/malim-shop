// Utilidades de formateo

// Formatear precio en MXN
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Calcular precio con descuento
export const calculateDiscountedPrice = (publicPrice, offerPercentage) => {
  if (!offerPercentage || offerPercentage === 0) return publicPrice;
  const discount = (publicPrice * offerPercentage) / 100;
  return publicPrice - discount;
};

// Obtener estado de stock
export const getStockStatus = (stock) => {
  if (stock === 0) return { status: 'out', label: 'Bajo Pedido', color: 'text-gray-600' };
  if (stock <= 3) return { status: 'low', label: `Solo ${stock} disponibles`, color: 'text-warning' };
  return { status: 'in', label: 'En Stock', color: 'text-success' };
};

// Obtener imagen principal de producto
export const getMainImage = (product) => {
  if (!product?.variants || product.variants.length === 0) return null;
  return product.variants[0]?.imageUrls?.[0] || null;
};

// Truncar texto
export const truncate = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
