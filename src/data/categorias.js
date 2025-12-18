// Categorías técnicas completas (del backend)
export const CATEGORIAS_PRODUCTOS = [
  {
    value: 'ROPASUPERIOR',
    label: 'Ropa Superior',
    children: [
      { value: 'BLUSAS', label: 'Blusas' },
      { value: 'PLAYERAS', label: 'Playeras / T-Shirts' },
      { value: 'POLOS', label: 'Camisas Polo' },
      { value: 'CAMISAS', label: 'Camisas (Formal/Casual)' },
      { value: 'TOPS_CORTOS', label: 'Tops / Cropped Tops' },
      { value: 'BRAS_BRALETTES', label: 'Bras / Bralettes' },
      { value: 'BLUSONES', label: 'Blusones' },
      { value: 'CHALECOS', label: 'Chalecos' },
    ],
  },
  {
    value: 'ROPAINFERIOR',
    label: 'Ropa Inferior',
    children: [
      { value: 'PANTALONES', label: 'Pantalones (Casual/Formal)' },
      { value: 'PANTS_JOGGERS', label: 'Pants / Joggers' },
      { value: 'SHORTS', label: 'Shorts' },
      { value: 'FALDAS', label: 'Faldas' },
      { value: 'LEGGINGS_MALLONES', label: 'Leggins / Mallones' },
    ],
  },
  {
    value: 'ROPAEXTERIOR',
    label: 'Ropa Exterior',
    children: [
      { value: 'ABRIGOS', label: 'Abrigos (Coats)' },
      { value: 'CHAMARRAS', label: 'Chamarras / Chaquetas (Jackets)' },
      { value: 'SUDADERAS', label: 'Sudaderas (Hoodies / Sweatshirts)' },
      { value: 'MAXI_SUDADERAS', label: 'Maxi Sudaderas' },
      { value: 'SACOS_BLAZERS', label: 'Sacos / Blazers' },
      { value: 'CAPAS_GABARDINAS', label: 'Capas / Gabardinas' },
      { value: 'ENSAMBLES', label: 'Ensambles / Cardigans' },
      { value: 'SUETERES', label: 'Suéteres (Sweaters)' },
    ],
  },
  {
    value: 'PRENDASCOMPLETAS',
    label: 'Prendas de una pieza',
    children: [
      { value: 'VESTIDOS', label: 'Vestidos' },
      { value: 'MAXI_VESTIDOS', label: 'Maxi Vestidos' },
      { value: 'OVEROLES', label: 'Overoles (Dungarees)' },
      { value: 'JUMPSUITS', label: 'Jumpsuits' },
      { value: 'BODIES', label: 'Bodys / Bodysuits' },
      { value: 'PALAZZOS', label: 'Palazzos' },
    ],
  },
  {
    value: 'ROPAINTERIOR',
    label: '👙 Lencería y Ropa Interior',
    children: [
      { value: 'ROPA_INTERIOR', label: 'Ropa Interior' },
      { value: 'MEDIAS', label: 'Medias / Pantimedias' },
      { value: 'PIJAMAS', label: 'Pijamas' },
    ],
  },
  {
    value: 'DEPORTIVA',
    label: '🏃 Ropa Deportiva',
    children: [
      { value: 'PLAYERAS_DEPORTIVAS', label: 'Playeras Deportivas' },
      { value: 'CONJUNTOS_DEPORTIVOS', label: 'Conjuntos Deportivos' },
    ],
  },
  {
    value: 'CALZADO',
    label: '👟 Calzado',
    children: [
      { value: 'TENNIS', label: 'Tenis / Sneakers' },
      { value: 'BOTAS_BOTINES', label: 'Botas / Botines' },
      { value: 'SANDALIAS', label: 'Sandalias / Chanclas' },
      { value: 'TACONES', label: 'Zapatos de Tacón' },
      { value: 'PLATAFORMAS', label: 'Plataformas' },
      { value: 'CALZADO_OTRO', label: 'Otros Tipos de Calzado' },
    ],
  },
  {
    value: 'ACCESORIOS',
    label: '💍 Accesorios',
    children: [
      { value: 'BOLSOS_CARTERAS', label: 'Bolsos y Carteras' },
      { value: 'JOYERIA', label: 'Joyería (Collares, Aretes, Pulseras)' },
      { value: 'CINTURONES', label: 'Cinturones' },
      { value: 'SOMBREROS_GORROS', label: 'Sombreros y Gorros' },
      { value: 'GUANTES', label: 'Guantes' },
      { value: 'BUFANDAS', label: 'Bufandas y Pañuelos' },
      { value: 'ACCESORIOS_CABELLO', label: 'Accesorios para Cabello' },
      { value: 'MAXI_COBIJAS', label: 'Maxi Cobijas / Ponchos' },
    ],
  },
  {
    value: 'INFANTIL',
    label: '👶 Ropa Infantil',
    children: [
      { value: 'NINIA', label: 'Infantil Niña' },
      { value: 'NINIO', label: 'Infantil Niño' },
      { value: 'UNISEX_INFANTIL', label: 'Niños Unisex' },
    ],
  },
  {
    value: 'ESPECIAL',
    label: '✨ Categorías Especiales',
    children: [
      { value: 'PATRIA', label: 'Patria' },
      { value: 'CONJUNTOS_COMPLETOS', label: 'Conjuntos (No deportivos)' },
      { value: 'OTROS', label: 'Otros' },
      { value: 'SIN_CATEGORIA', label: 'Sin Categoría' },
    ],
  },
];

// Categorías comerciales agrupadas para facilitar navegación del usuario
export const CATEGORIAS_COMERCIALES = [
  {
    id: 'invierno',
    nombre: 'Invierno',
    descripcion: 'Mantente abrigada con estilo',
    imagen: '/banners/invierno.jpg',
    icon: '🧥',
    categoriasTecnicas: [
      'ABRIGOS', 'CHAMARRAS', 'SUDADERAS', 'MAXI_SUDADERAS', 
      'SUETERES', 'CAPAS_GABARDINAS', 'MAXI_COBIJAS', 'BUFANDAS'
    ]
  },
  {
    id: 'vestidos',
    nombre: 'Vestidos',
    descripcion: 'Elegancia en cada ocasión',
    imagen: '/banners/vestidos.jpg',
    icon: '👗',
    categoriasTecnicas: [
      'VESTIDOS', 'MAXI_VESTIDOS', 'JUMPSUITS', 'OVEROLES'
    ]
  },
  {
    id: 'casual',
    nombre: 'Casual',
    descripcion: 'Comodidad para el día a día',
    imagen: '/banners/casual.jpg',
    icon: '👕',
    categoriasTecnicas: [
      'BLUSAS', 'PLAYERAS', 'TOPS_CORROS', 'PANTALONES', 
      'SHORTS', 'FALDAS', 'LEGGINGS_MALLONES'
    ]
  },
  {
    id: 'deporte',
    nombre: 'Deportiva',
    descripcion: 'Activa y cómoda',
    imagen: '/banners/deportiva.jpg',
    icon: '🏃‍♀️',
    categoriasTecnicas: [
      'PLAYERAS_DEPORTIVAS', 'CONJUNTOS_DEPORTIVOS', 
      'LEGGINGS_MALLONES', 'PANTS_JOGGERS', 'TENNIS'
    ]
  },
  {
    id: 'infantil',
    nombre: 'Infantil',
    descripcion: 'Estilo para los más pequeños',
    imagen: '/banners/infantil.jpg',
    icon: '👶',
    categoriasTecnicas: [
      'NINIA', 'NINIO', 'UNISEX_INFANTIL'
    ]
  },
  {
    id: 'formal',
    nombre: 'Formal',
    descripcion: 'Sofisticación profesional',
    imagen: '/banners/formal.jpg',
    icon: '💼',
    categoriasTecnicas: [
      'SACOS_BLAZERS', 'CAMISAS', 'PANTALONES', 
      'FALDAS', 'VESTIDOS', 'TACONES'
    ]
  },
  {
    id: 'calzado',
    nombre: 'Calzado',
    descripcion: 'El toque final perfecto',
    imagen: '/banners/calzado.jpg',
    icon: '👠',
    categoriasTecnicas: [
      'TENNIS', 'BOTAS_BOTINES', 'SANDALIAS', 
      'TACONES', 'PLATAFORMAS', 'CALZADO_OTRO'
    ]
  },
  {
    id: 'accesorios',
    nombre: 'Accesorios',
    descripcion: 'Detalles que marcan la diferencia',
    imagen: '/banners/accesorios.jpg',
    icon: '💍',
    categoriasTecnicas: [
      'BOLSOS_CARTERAS', 'JOYERIA', 'CINTURONES', 
      'SOMBREROS_GORROS', 'ACCESORIOS_CABELLO'
    ]
  },
];

// Función helper para verificar si un producto pertenece a una categoría comercial
export function productoEnCategoriaComercial(producto, categoriaComercialId) {
  const categoria = CATEGORIAS_COMERCIALES.find(c => c.id === categoriaComercialId);
  if (!categoria) return false;
  
  // Verificar si la categoría del producto está en las categorías técnicas
  // Soportar ambos nombres de campo: categoria y category
  const categoriaProducto = producto.categoria || producto.category;
  return categoria.categoriasTecnicas.includes(categoriaProducto);
}

// Función para obtener el nombre legible de una categoría técnica
export function getNombreCategoriaTecnica(categoriaValue) {
  for (const grupo of CATEGORIAS_PRODUCTOS) {
    if (grupo.value === categoriaValue) return grupo.label;
    
    const child = grupo.children?.find(c => c.value === categoriaValue);
    if (child) return child.label;
  }
  // Si no se encuentra, formatear el valor: reemplazar guiones bajos por espacios y capitalizar
  return categoriaValue ? categoriaValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : categoriaValue;
}

// Todas las categorías técnicas en lista plana (útil para filtros)
export const TODAS_CATEGORIAS_TECNICAS = CATEGORIAS_PRODUCTOS.flatMap(grupo => 
  grupo.children ? grupo.children : [grupo]
);
