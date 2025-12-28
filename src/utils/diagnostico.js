// Script de diagnóstico para revisar la estructura de datos
import { db } from '../credenciales';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export const diagnosticarEstructura = async () => {
  console.log('🔍 DIAGNÓSTICO DE ESTRUCTURA DE DATOS');
  console.log('=====================================\n');

  try {
    // Obtener un producto de ejemplo
    const q = query(collection(db, 'productos_public'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron productos en la colección "productos_public"');
      return;
    }

    const producto = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    console.log('📦 PRODUCTO DE EJEMPLO:');
    console.log('ID:', producto.id);
    console.log('Nombre:', producto.name);
    console.log('\n📊 ESTRUCTURA:');
    console.log(JSON.stringify(producto, null, 2));

    console.log('\n🎨 ANÁLISIS DE VARIANTES:');
    if (producto.variants && Array.isArray(producto.variants)) {
      console.log(`✓ Tiene ${producto.variants.length} variantes`);
      
      producto.variants.forEach((variant, index) => {
        console.log(`\n  Variante ${index + 1}:`);
        console.log(`  - ID: ${variant.id || 'NO TIENE'}`);
        console.log(`  - Color: ${variant.colorName || 'NO TIENE'}`);
        console.log(`  - Hex: ${variant.hexColor || 'NO TIENE'}`);
        console.log(`  - Imágenes: ${variant.imageUrls?.length || 0}`);
        
        console.log(`\n  📏 TALLAS (${variant.sizes?.length || 0}):`);
        if (variant.sizes && Array.isArray(variant.sizes)) {
          variant.sizes.forEach((size, sizeIndex) => {
            console.log(`    ${sizeIndex + 1}. Talla: ${size.size}`);
            console.log(`       Stock: ${size.stock}`);
            console.log(`       variantSku: ${size.variantSku || '❌ NO TIENE'}`);
            console.log(`       sku: ${size.sku || '❌ NO TIENE'}`);
            console.log(`       ---`);
          });
        } else {
          console.log('    ❌ No tiene array de sizes');
        }
      });
    } else {
      console.log('❌ No tiene array de variants');
    }

    console.log('\n💡 RESUMEN:');
    const primerVariante = producto.variants?.[0];
    const primeraTalla = primerVariante?.sizes?.[0];
    
    if (!primeraTalla) {
      console.log('❌ PROBLEMA: No se pudo acceder a una talla de ejemplo');
      return;
    }

    console.log('\n📝 CAMPOS DISPONIBLES EN TALLA:');
    Object.keys(primeraTalla).forEach(key => {
      console.log(`  ✓ ${key}: ${typeof primeraTalla[key]}`);
    });

    if (!primeraTalla.variantSku && !primeraTalla.sku) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO:');
      console.log('❌ Las tallas NO tienen campo "variantSku" ni "sku"');
      console.log('Esto significa que el SKU se está generando dinámicamente en el frontend');
      console.log('\n🔧 SOLUCIÓN:');
      console.log('Para que el backend pueda descontar stock, necesitamos:');
      console.log('1. Agregar variantSku a cada talla en Firestore, O');
      console.log('2. Actualizar el backend para que use productId + variantId + size');
    } else if (primeraTalla.variantSku) {
      console.log('\n✅ BIEN: Las tallas SÍ tienen variantSku');
      console.log('Ejemplo:', primeraTalla.variantSku);
      console.log('\n🔧 SOLUCIÓN:');
      console.log('El backend debe buscar por variantSku directamente en el array de sizes');
      console.log('Ver archivo PROBLEMA_STOCK.md para el código completo del webhook');
    }

    // Generar ejemplo de SKU
    const skuGenerado = `${producto.id}-${primerVariante.id}-${primeraTalla.size}`;
    console.log('\n📌 SKU GENERADO POR EL FRONTEND:');
    console.log(skuGenerado);
    console.log('\n📌 LO QUE EL BACKEND DEBE BUSCAR:');
    console.log('Producto ID:', producto.id);
    console.log('Variante ID:', primerVariante.id);
    console.log('Talla:', primeraTalla.size);

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
};

// Ejecutar diagnóstico automáticamente al importar
if (typeof window !== 'undefined') {
  window.diagnosticarEstructura = diagnosticarEstructura;
  console.log('\n💡 Para ejecutar el diagnóstico, escribe en la consola:');
  console.log('diagnosticarEstructura()');
}
