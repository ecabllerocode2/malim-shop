// Página de prueba simple para verificar Firestore
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../credenciales';

const TestFirestore = () => {
  const [status, setStatus] = useState('Iniciando...');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('1️⃣ Probando conexión a Firestore...');
      
      // Test 1: Leer colección sin filtros
      setStatus('2️⃣ Leyendo colección "productos" (sin filtros)...');
      const allSnap = await getDocs(collection(db, 'productos'));
      alert(`✅ Conexión exitosa!\n\n${allSnap.size} documentos encontrados en total`);
      
      // Test 2: Con filtro publishOnline
      setStatus('3️⃣ Filtrando por publishOnline = true...');
      const q = query(
        collection(db, 'productos'),
        where('publishOnline', '==', true)
      );
      const filteredSnap = await getDocs(q);
      
      const productsData = filteredSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProducts(productsData);
      alert(`✅ Productos publicados: ${productsData.length}\n\nPrimero: ${productsData[0]?.name || 'sin nombre'}`);
      setStatus('✅ Prueba completada!');
      
    } catch (err) {
      const msg = `❌ ERROR:\n\n${err.code}\n${err.message}`;
      alert(msg);
      setError(err.message);
      setStatus('❌ Error en la prueba');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>🔥 Test Firestore</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>Estado:</strong> {status}
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {products.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
            Productos encontrados: {products.length}
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {products.map((p, i) => (
              <div 
                key={p.id}
                style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <strong>#{i + 1}</strong> - {p.name || p.prenda || p.id}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ID: {p.id} | Online: {p.publishOnline ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={testConnection}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🔄 Volver a probar
        </button>
      </div>
    </div>
  );
};

export default TestFirestore;
