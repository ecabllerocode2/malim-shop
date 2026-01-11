# Sistema de Actualización Automática

## 🚀 Descripción

Sistema implementado para actualizar automáticamente la aplicación sin intervención del usuario cada vez que se hace un deploy nuevo.

## 📋 Cómo Funciona

### 1. **Versionado Automático**
- Cada build genera un archivo `version.json` con timestamp único
- Se crea automáticamente en `public/version.json` antes de cada build
- Contiene: timestamp, fecha y buildId

### 2. **Detección de Actualizaciones**
El hook `useAutoUpdate` verifica nuevas versiones:
- ✅ **Cada 5 minutos** automáticamente
- ✅ **Al recuperar el foco** de la ventana
- ✅ **Al recuperar conexión** a internet
- ✅ **Al cargar la app** por primera vez

### 3. **Actualización Silenciosa**
Cuando detecta una nueva versión:
1. Limpia todos los cachés (Service Worker + localStorage)
2. Desregistra el Service Worker anterior
3. Guarda la nueva versión
4. Recarga la página automáticamente
5. ⚡ **Todo sin intervención del usuario**

### 4. **Service Worker Optimizado**
- `skipWaiting: true` - Activa inmediatamente sin esperar
- `clientsClaim: true` - Toma control de inmediato
- `cleanupOutdatedCaches: true` - Limpia cachés viejos automáticamente

## 🔧 Configuración

### Build Script
```json
"build": "node generate-version.js && vite build"
```

### Service Worker (vite.config.js)
```javascript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true
  }
})
```

## 📦 Archivos Creados/Modificados

1. **`generate-version.js`** - Script para generar version.json
2. **`src/hooks/useAutoUpdate.js`** - Hook de actualización automática
3. **`public/version.json`** - Archivo de versión (generado en cada build)
4. **`vite.config.js`** - Configuración del Service Worker
5. **`package.json`** - Script de build actualizado
6. **`src/main.jsx`** - Integración del hook

## 🎯 Ventajas

✅ **Cero fricción** - El usuario nunca ve prompts ni botones  
✅ **Siempre actualizado** - Máximo 5 minutos de delay  
✅ **Cache limpio** - Elimina automáticamente versiones viejas  
✅ **Migración automática** - Usuarios con cache viejo se actualizan solos  
✅ **PWA compatible** - Funciona tanto en web como PWA instalada  

## 🔄 Proceso de Deploy

Cada vez que hagas deploy:
1. `npm run build` genera nuevo version.json automáticamente
2. Usuarios detectan la nueva versión en máximo 5 minutos
3. La app se actualiza automáticamente sin avisar
4. Cache viejo se limpia completamente

## 🧪 Testing

### En desarrollo:
```bash
npm run dev
```
El sistema está desactivado en desarrollo para no interferir.

### En producción:
```bash
npm run build
npm run preview
```

Para simular un deploy:
1. Haz cambios en el código
2. Ejecuta `npm run build`
3. La próxima vez que se verifique (máx 5min), se actualizará

## ⚠️ Notas Importantes

- **No molesta al usuario**: Sin popups ni notificaciones
- **Respeta la sesión**: Mantiene auth tokens
- **Limpia selectivamente**: Solo borra cache de productos/cart viejos
- **Funciona offline**: Se actualiza cuando vuelve la conexión

## 🐛 Troubleshooting

Si un usuario tiene problemas con cache:
1. El sistema se auto-corregirá en máximo 5 minutos
2. O al recuperar el foco de la ventana
3. O al volver la conexión a internet

No es necesario que el usuario haga nada manualmente.
