// Página de catálogo con filtros
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilter, FaTimes, FaSearch } from 'react-icons/fa';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { CATEGORIAS_COMERCIALES, productoEnCategoriaComercial, getNombreCategoriaTecnica } from '../data/categorias';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading } = useProducts();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Categoría comercial actual
  const categoriaActual = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return CATEGORIAS_COMERCIALES.find(c => c.id === selectedCategory);
  }, [selectedCategory]);



  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrar por búsqueda de texto
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const nombre = (p.prenda || p.name || '').toLowerCase();
        const descripcion = (p.descripcion || p.description || p.shortDetails || '').toLowerCase();
        const categoria = getNombreCategoriaTecnica(p.categoria || p.category || '').toLowerCase();
        return nombre.includes(search) || descripcion.includes(search) || categoria.includes(search);
      });
    }

    // Filtrar por categoría comercial
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => productoEnCategoriaComercial(p, selectedCategory));
    }

    // Filtrar por ofertas (usando parámetro 'ofertas' en lugar de 'filter')
    if (searchParams.get('ofertas') === 'true') {
      filtered = filtered.filter(p => {
        const tieneOferta = (p.offerPercentage || 0) > 0 || (p.offer || 0) > 0;
        return tieneOferta;
      });
    }

    // Filtrar por nuevos (productos del mes actual)
    if (searchParams.get('filter') === 'nuevos') {
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
      
      filtered = filtered.filter(p => {
        const fechaProducto = p.dateAdded || 0;
        return fechaProducto >= inicioMes && fechaProducto <= finMes;
      });
    }

    // Ordenar
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => (a.precio || a.publicPrice || 0) - (b.precio || b.publicPrice || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.precio || b.publicPrice || 0) - (a.precio || a.publicPrice || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.prenda || a.name || '').localeCompare(b.prenda || b.name || ''));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, selectedCategory, sortBy, searchTerm, searchParams]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    
    // Actualizar URL solo con la categoría
    const newParams = new URLSearchParams();
    if (category !== 'all') {
      newParams.set('categoria', category);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setSortBy('newest');
    setSearchParams(new URLSearchParams());
  };
  
  // Sincronizar categoría desde URL al cargar
  useEffect(() => {
    const categoriaUrl = searchParams.get('categoria');
    if (categoriaUrl && categoriaUrl !== selectedCategory) {
      setSelectedCategory(categoriaUrl);
    }
  }, []); // Solo al montar el componente

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {categoriaActual ? categoriaActual.nombre : 'Nuestro Catálogo'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {categoriaActual ? categoriaActual.descripcion : 'Explora nuestra colección completa de prendas únicas'}
            </p>
          </motion.div>
          
          {/* Barra de búsqueda */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Buscar por nombre, descripción o categoría..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-14 pr-12 py-4 rounded-2xl border-2 border-white/50 bg-white/80 backdrop-blur-sm focus:border-primary-400 focus:bg-white focus:outline-none transition-all text-lg shadow-soft"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Barra de filtros y ordenamiento */}
        <div className="bg-white rounded-2xl shadow-soft p-4 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Categorías Desktop */}
            <div className="hidden md:flex gap-2 overflow-x-auto flex-1">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {CATEGORIAS_COMERCIALES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Botón filtros Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
            >
              <FaFilter className="w-4 h-4" />
              Filtros
            </button>

            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="newest">Más Recientes</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name">Nombre A-Z</option>
            </select>

            {/* Contador */}
            <div className="text-gray-600 text-sm whitespace-nowrap">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              {searchTerm && ` encontrados`}
            </div>
          </div>

          {/* Categorías Mobile (expandible) */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    handleCategoryChange('all');
                    setShowFilters(false);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Todas
                </button>
                {CATEGORIAS_COMERCIALES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleCategoryChange(cat.id);
                      setShowFilters(false);
                    }}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Grid de productos */}
        {loading ? (
          <ProductGridSkeleton count={12} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🔍</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar los filtros o buscar algo diferente
            </p>
            <Button
              onClick={clearFilters}
              variant="primary"
            >
              Limpiar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
