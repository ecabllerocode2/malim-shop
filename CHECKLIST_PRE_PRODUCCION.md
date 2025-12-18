# ✅ Checklist Pre-Producción - Malim Shop

## 🎯 Usar este checklist justo antes del merge a `main`

---

## 1️⃣ Cuenta de Stripe

- [ ] Cuenta de Stripe creada y activada
- [ ] Información del negocio completada
- [ ] Cuenta bancaria vinculada
- [ ] Identidad verificada
- [ ] Puedes ver "Live mode" disponible en el dashboard

---

## 2️⃣ Llaves de Stripe Obtenidas

- [ ] `pk_live_XXXX` (Publishable Key - Live) ✍️ _________________
- [ ] `sk_live_XXXX` (Secret Key - Live) ✍️ _________________
- [ ] `whsec_XXXX` (Webhook Secret - Live) ✍️ _________________

---

## 3️⃣ Variables Frontend (Vercel)

Ve a: **Vercel Dashboard > malim-shop (frontend) > Settings > Environment Variables**

- [ ] `VITE_STRIPE_PUBLIC_KEY` = `pk_live_XXXX` ✅
- [ ] `VITE_BACKEND_URL` = `https://malim-backend.vercel.app` ✅
- [ ] `VITE_GA_ID` = `G-9DD5YEX28R` ✅
- [ ] Variables aplicadas a: Production ☑️ Preview ☑️ Development ☑️
- [ ] **REDEPLOY realizado** después de cambios

---

## 4️⃣ Variables Backend (Vercel)

Ve a: **Vercel Dashboard > malim-backend > Settings > Environment Variables**

- [ ] `STRIPE_SECRET_KEY` = `sk_live_XXXX` ✅
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_XXXX` ✅
- [ ] Variables aplicadas a: Production ☑️ Preview ☑️ Development ☑️
- [ ] **REDEPLOY realizado** después de cambios

---

## 5️⃣ Webhook de Stripe Configurado

Ve a: **Stripe Dashboard > Developers > Webhooks (LIVE MODE)**

- [ ] Webhook creado en Live mode
- [ ] URL: `https://malim-backend.vercel.app/api/stripe-webhook` ✅
- [ ] Eventos seleccionados: `checkout.session.completed` ✅
- [ ] Estado del webhook: **Enabled** 🟢
- [ ] Signing secret copiado a variables de backend ✅

---

## 6️⃣ Pruebas en Test Mode

Antes de cambiar a producción, verifica en **TEST MODE**:

- [ ] Compra de prueba completada con `4242 4242 4242 4242`
- [ ] Redirección a página de éxito funciona
- [ ] Stock se descuenta correctamente en Firestore
- [ ] Webhook recibe eventos (ver Stripe Dashboard > Webhooks)
- [ ] Logs del backend no muestran errores

---

## 7️⃣ Prueba Final con Llaves Live (Recomendado)

**OPCIONAL pero MUY RECOMENDADO**: Hacer una compra real pequeña antes del merge

- [ ] Crear rama temporal: `git checkout -b test-production`
- [ ] Cambiar variables a Live mode en Vercel (ambos proyectos)
- [ ] Redeploy ambos proyectos
- [ ] Hacer compra real de **$10 MXN** o el mínimo posible
- [ ] Verificar:
  - [ ] Pago aparece en Stripe Dashboard (Live mode)
  - [ ] Stock se descuenta
  - [ ] Webhook funciona (ver logs)
  - [ ] Página de éxito se muestra
- [ ] Si todo funciona ✅ → Proceder con merge
- [ ] Si algo falla ❌ → Revertir y debuguear

---

## 8️⃣ Seguridad y Código

- [ ] `.env` está en `.gitignore` ✅ (verificado)
- [ ] No hay llaves hardcodeadas en el código
- [ ] Archivo `BACKEND_ENDPOINT_FIXED.js` revisado (no contiene secretos)
- [ ] Credenciales de Firebase son públicas (OK, son de frontend)
- [ ] NUNCA se sube `sk_live_` o `sk_test_` a Git

---

## 9️⃣ Documentación

- [ ] `GUIA_PRODUCCION_STRIPE.md` leída y comprendida
- [ ] `.env.example` actualizado
- [ ] `BACKEND_ENV_EXAMPLE.md` revisado
- [ ] Equipo informado sobre el cambio

---

## 🔟 Git y Deploy

- [ ] Rama `desarrollo-v2` funciona correctamente
- [ ] Todos los commits importantes están pusheados
- [ ] Crear Pull Request: `desarrollo-v2` → `main`
- [ ] Título del PR: "🚀 Cambio a producción - Stripe Live Mode"
- [ ] Descripción del PR incluye este checklist
- [ ] **REVISAR EL PR** antes de mergear
- [ ] Mergear el PR
- [ ] Verificar deploy automático en Vercel
- [ ] Verificar que el sitio funciona en producción

---

## 1️⃣1️⃣ Post-Lanzamiento (Primeras 24h)

- [ ] Monitorear Stripe Dashboard (Live mode) > Payments
- [ ] Revisar logs de Vercel (frontend y backend)
- [ ] Verificar webhooks en Stripe Dashboard > Webhooks
- [ ] Hacer al menos 1 compra de prueba real
- [ ] Confirmar que el stock se descuenta
- [ ] Verificar que no hay errores en consola del navegador
- [ ] Revisar Firestore para anomalías en stock

---

## 🆘 Plan de Rollback

**Si algo sale mal DESPUÉS del merge:**

1. Ve a Vercel > malim-shop (frontend) > Environment Variables
2. Cambia `VITE_STRIPE_PUBLIC_KEY` de vuelta a `pk_test_XXX`
3. Ve a Vercel > malim-backend > Environment Variables  
4. Cambia `STRIPE_SECRET_KEY` de vuelta a `sk_test_XXX`
5. Redeploy ambos proyectos
6. Debuguear con calma en ambiente de test

---

## 📊 Información de Contacto de Emergencia

- **Stripe Soporte**: https://support.stripe.com
- **Vercel Status**: https://www.vercel-status.com
- **Firebase Status**: https://status.firebase.google.com

---

## ✅ TODO LISTO

Cuando TODOS los checkboxes estén marcados:

```bash
# 1. Asegúrate de estar en desarrollo-v2
git checkout desarrollo-v2
git pull origin desarrollo-v2

# 2. Crear y mergear PR
# Ve a GitHub y crea el Pull Request desde desarrollo-v2 a main

# 3. O mergear directamente (si trabajas solo)
git checkout main
git pull origin main
git merge desarrollo-v2
git push origin main

# 4. Monitorear el deploy en Vercel
```

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí y todo funcionó, **¡tu tienda está en producción!** 🚀

**¡Mucho éxito con las ventas!** 💰
