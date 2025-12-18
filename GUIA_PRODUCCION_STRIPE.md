# 🚀 Guía de Cambio a Producción - Variables de Entorno Stripe

## 📋 Resumen de tu Arquitectura Actual

Tu proyecto está dividido en dos partes:

1. **Frontend (Vite + React)** → Desplegado en Vercel
   - Variables en archivo `.env` local
   - Variables de entorno en Vercel para producción

2. **Backend (Serverless Functions)** → Desplegado en `malim-backend.vercel.app`
   - Variables de entorno configuradas en el proyecto de Vercel del backend

---

## 🔑 Variables de Entorno Actuales (TEST MODE)

### Frontend (.env)
```env
VITE_GA_ID=G-9DD5YEX28R
VITE_STRIPE_PUBLIC_KEY=pk_test_51SfV3j1T81KvloQu0MMytbpoWFMa3Yk0JMhsrerRtMfYoX4rFQnIqXj6rq9fw3iaf2mCYp5ZFYeS9rb8cpxitDst00PW7dIccV
VITE_BACKEND_URL=https://malim-backend.vercel.app
```

### Backend (malim-backend en Vercel)
```env
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX (actualmente en test mode)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX (si tienes webhook configurado)
```

---

## ✅ Pasos para Cambiar a Producción

### 1️⃣ Activar tu Cuenta de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Completa los datos de tu negocio**:
   - Información legal de la empresa
   - Datos bancarios para recibir pagos
   - Verificación de identidad (puede requerir documentos)
3. Espera la aprobación de Stripe (puede tardar de minutos a días)

### 2️⃣ Obtener las Llaves de Producción

Una vez activada tu cuenta:

1. Ve a **Developers** > **API keys**
2. En la parte superior, cambia de **"Test mode"** a **"Live mode"** (toggle)
3. Copia las siguientes llaves:
   - **Publishable key (live)**: `pk_live_XXXXXXXXXXXX`
   - **Secret key (live)**: `sk_live_XXXXXXXXXXXX` ⚠️ Nunca la compartas

### 3️⃣ Actualizar Variables en el Frontend

#### Opción A: En Vercel (Producción)
1. Ve a tu proyecto frontend en [Vercel Dashboard](https://vercel.com)
2. Settings > Environment Variables
3. **Edita** la variable existente:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXX
   ```
4. Selecciona los ambientes: **Production, Preview, Development**
5. Guarda los cambios
6. **Redeploy** el proyecto para aplicar los cambios

#### Opción B: En tu archivo .env local (Desarrollo)
Si quieres probar con llaves de producción en local:
```env
VITE_STRIPE_PUBLIC_KEY=pk_live_XXXXXXXXXXXX
```
⚠️ **Recomendación**: Usa llaves de test en desarrollo y live solo en producción

### 4️⃣ Actualizar Variables en el Backend

1. Ve al proyecto **malim-backend** en [Vercel Dashboard](https://vercel.com)
2. Settings > Environment Variables
3. **Edita** las siguientes variables:

```env
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX
```

4. Selecciona los ambientes: **Production, Preview, Development**
5. Guarda los cambios
6. **Redeploy** el proyecto backend para aplicar los cambios

### 5️⃣ Configurar Webhook en Modo Producción (IMPORTANTE)

Si tienes un webhook configurado para descontar stock:

1. Ve a **Stripe Dashboard** > **Developers** > **Webhooks**
2. Busca tu webhook existente o crea uno nuevo
3. **Cambia a "Live mode"** (toggle superior)
4. Configura:
   - **URL del endpoint**: `https://malim-backend.vercel.app/api/stripe-webhook`
   - **Eventos a escuchar**: 
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.payment_failed` (opcional)
5. **Copia el "Signing secret"** (empieza con `whsec_`)
6. Agrega/actualiza en **malim-backend** en Vercel:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX_LIVE_VERSION
   ```
7. **Redeploy** el backend

---

## 🔐 Tabla Resumen de Variables

| Variable | Ubicación | Test Mode | Production Mode |
|----------|-----------|-----------|-----------------|
| `VITE_STRIPE_PUBLIC_KEY` | Frontend (.env + Vercel) | `pk_test_...` | `pk_live_...` ✅ |
| `STRIPE_SECRET_KEY` | Backend (Vercel) | `sk_test_...` | `sk_live_...` ✅ |
| `STRIPE_WEBHOOK_SECRET` | Backend (Vercel) | `whsec_...test` | `whsec_...live` ✅ |
| `VITE_BACKEND_URL` | Frontend | No cambia | No cambia |
| `VITE_GA_ID` | Frontend | No cambia | No cambia |

---

## 🧪 Cómo Probar Antes del Lanzamiento

### 1. Verificar que TODO funciona en Test Mode
- [ ] El checkout abre correctamente
- [ ] Los pagos se procesan con tarjeta de prueba `4242 4242 4242 4242`
- [ ] El stock se descuenta correctamente
- [ ] Se muestra la página de éxito
- [ ] Los webhooks funcionan (verifica logs en Stripe)

### 2. Hacer un Deploy de Prueba con Llaves Live
1. Crea una **rama temporal** para probar: `git checkout -b test-stripe-live`
2. Actualiza las variables en Vercel
3. Haz un deploy de esa rama
4. **Haz una compra REAL** con una tarjeta verdadera (compra pequeña, ej: $10 MXN)
5. Verifica:
   - [ ] El pago se procesa
   - [ ] Aparece en tu Stripe Dashboard (en Live mode)
   - [ ] El stock se descuenta
   - [ ] El webhook funciona
   - [ ] Los fondos llegarán a tu cuenta bancaria

### 3. Si todo funciona, haz el merge
```bash
git checkout main
git merge test-stripe-live
git push origin main
```

---

## ⚠️ IMPORTANTE: Seguridad

### ✅ LO QUE DEBES HACER
- Mantener el `.env` en `.gitignore` ✅ (ya lo tienes)
- NUNCA subir llaves secretas a Git
- Usar variables de entorno en Vercel
- Rotar llaves si se exponen accidentalmente

### ❌ NUNCA HACER
- ❌ Hardcodear llaves en el código
- ❌ Compartir `sk_live_` con nadie
- ❌ Subir `.env` a GitHub
- ❌ Usar llaves de producción en desarrollo local sin necesidad

---

## 🔄 Rollback Plan (Si algo sale mal)

Si después del cambio algo falla:

1. **Volver a Test Mode rápidamente**:
   - Ve a Vercel > Frontend > Environment Variables
   - Cambia `VITE_STRIPE_PUBLIC_KEY` de vuelta a `pk_test_...`
   - Ve a Vercel > Backend > Environment Variables
   - Cambia `STRIPE_SECRET_KEY` de vuelta a `sk_test_...`
   - Redeploy ambos proyectos

2. **Revisar logs**:
   - Vercel Dashboard > tu proyecto > Deployments > View Function Logs
   - Stripe Dashboard > Developers > Logs

---

## 📊 Monitoreo Post-Lanzamiento

Después de cambiar a producción, monitorea:

1. **Stripe Dashboard** (Live mode):
   - Ve a **Payments** para ver transacciones en tiempo real
   - Revisa **Webhooks** para verificar que se reciben correctamente

2. **Vercel Logs**:
   - Revisa los logs de tus functions para errores

3. **Firestore**:
   - Verifica que el stock se esté descontando correctamente

---

## 📝 Checklist Final

### Antes del merge a main
- [ ] Cuenta de Stripe activada y verificada
- [ ] Datos bancarios configurados en Stripe
- [ ] Llaves de producción obtenidas (`pk_live_` y `sk_live_`)
- [ ] Variables actualizadas en Frontend (Vercel)
- [ ] Variables actualizadas en Backend (Vercel)
- [ ] Webhook configurado en modo Live
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado en backend
- [ ] Prueba realizada con compra real pequeña
- [ ] Stock se descuenta correctamente en prueba
- [ ] Todo funciona en rama de prueba

### Después del merge
- [ ] Deploy de producción exitoso
- [ ] Hacer una compra de prueba final
- [ ] Monitorear primeras 24 horas
- [ ] Verificar que los pagos llegan a la cuenta bancaria (2-7 días)

---

## 🆘 Solución de Problemas Comunes

### "Invalid API Key"
- Verifica que copiaste la llave completa (no cortada)
- Asegúrate de estar usando `pk_live_` en frontend y `sk_live_` en backend
- Redeploy después de cambiar variables

### "Webhook signature verification failed"
- El `STRIPE_WEBHOOK_SECRET` debe ser el de Live mode
- Copia el signing secret correcto desde Stripe Dashboard (en Live mode)
- Redeploy el backend después de actualizar

### "No matching source found"
- Verifica que la URL del webhook en Stripe apunte a tu backend correcto
- Asegúrate de que el endpoint esté desplegado y accesible

### El stock no se descuenta
- Verifica logs del webhook en Stripe Dashboard
- Revisa logs de Vercel del backend
- Asegúrate de que el webhook esté en Live mode

---

## 📞 Contacto y Recursos

- **Stripe Soporte**: https://support.stripe.com
- **Documentación Stripe**: https://stripe.com/docs
- **Status de Stripe**: https://status.stripe.com
- **Tu Dashboard**: https://dashboard.stripe.com

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos, tu tienda estará procesando pagos reales. 

**¡Mucho éxito con el lanzamiento! 🚀**
