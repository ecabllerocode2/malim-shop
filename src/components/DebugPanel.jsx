// Componente de Debug visible en pantalla
import { useProducts } from '../contexts/ProductsContext';

const DebugPanel = () => {
  const { products, loading, error } = useProducts();

  if (!window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        maxHeight: '200px',
        overflow: 'auto',
        borderTop: '3px solid #00ff00'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffff00' }}>
        🐛 DEBUG PANEL (añade ?debug=true a la URL)
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <strong>Estado:</strong> {loading ? '⏳ Cargando...' : '✅ Listo'}
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <strong>Productos cargados:</strong> {products?.length || 0}
      </div>
      
      {error && (
        <div style={{ marginBottom: '4px', color: '#ff4444' }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}
      
      {products && products.length > 0 && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <strong>Primeros 3 productos:</strong>
          {products.slice(0, 3).map((p, i) => (
            <div key={i} style={{ marginLeft: '8px', fontSize: '11px' }}>
              • {p.name || p.prenda || p.id} ({p.publishOnline ? '✅ Online' : '❌ Offline'})
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
        Recarga la página para ver cambios • F5
      </div>
    </div>
  );
};

export default DebugPanel;
