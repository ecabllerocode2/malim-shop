# ================================
# VARIABLES DE ENTORNO - BACKEND
# ================================
# Este archivo NO se usa directamente en el código
# Es solo documentación de las variables que debes configurar en Vercel
# para el proyecto malim-backend

# ================================
# CONFIGURAR EN VERCEL
# ================================
# Ve a: https://vercel.com > tu-proyecto-backend > Settings > Environment Variables

# Stripe Secret Key (CRÍTICO - NUNCA EXPONGAS ESTA LLAVE)
# Test Mode: sk_test_XXXXXXXXXXXX
# Production Mode: sk_live_XXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX

# Stripe Webhook Secret (para verificar que los webhooks vienen de Stripe)
# Test Mode: whsec_XXXXXXXXXXXX
# Production Mode: whsec_XXXXXXXXXXXX (diferente del test)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# ================================
# CÓMO OBTENER ESTAS LLAVES
# ================================

# STRIPE_SECRET_KEY:
# 1. Ve a https://dashboard.stripe.com
# 2. Developers > API keys
# 3. En Test mode: copia "Secret key" (sk_test_...)
# 4. En Production: activa tu cuenta y cambia a Live mode, copia "Secret key" (sk_live_...)

# STRIPE_WEBHOOK_SECRET:
# 1. Ve a https://dashboard.stripe.com
# 2. Developers > Webhooks
# 3. Crea o edita un webhook con URL: https://tu-backend.vercel.app/api/stripe-webhook
# 4. Selecciona eventos: checkout.session.completed
# 5. Copia el "Signing secret" (whsec_...)
# 6. IMPORTANTE: El signing secret es diferente en Test y Live mode

# ================================
# ESTRUCTURA DEL BACKEND
# ================================

# Tu backend debe tener esta estructura:
# /api
#   ├── create-checkout-session.js  (crear sesión de pago)
#   └── stripe-webhook.js           (recibir confirmaciones y descontar stock)

# Ambos archivos usan STRIPE_SECRET_KEY
# El webhook también usa STRIPE_WEBHOOK_SECRET

# ================================
# SEGURIDAD
# ================================

# ⚠️ NUNCA:
# - Subas estas llaves a Git
# - Compartas sk_live_ o sk_test_ públicamente
# - Uses llaves de producción en desarrollo sin necesidad
# - Hardcodees las llaves en el código

# ✅ SIEMPRE:
# - Usa variables de entorno en Vercel
# - Rota las llaves si se exponen
# - Usa sk_test_ en desarrollo y sk_live_ solo en producción
# - Mantén un backup seguro de tus llaves

# ================================
# VERIFICACIÓN
# ================================

# Para verificar que todo funciona:
# 1. En Stripe Dashboard > Developers > Logs (test mode)
#    - Haz una compra de prueba
#    - Verifica que aparezca el pago
# 2. En Vercel > tu-backend > Deployments > Function Logs
#    - Verifica que no hay errores
#    - Busca los console.log de tus funciones
# 3. En Stripe Dashboard > Developers > Webhooks
#    - Verifica que los eventos lleguen correctamente
#    - Revisa que no haya errores de firma

# Para más información, lee: GUIA_PRODUCCION_STRIPE.md
