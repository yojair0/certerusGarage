# 🚀 Guía de Despliegue en Render (100% GRATIS)

## ✅ Lo que ya está listo

- ✅ Archivo `render.yaml` creado
- ✅ Configuración de Redis gratuito incluida
- ✅ Código compatible con NeonDB (PostgreSQL)
- ✅ SSL configurado para base de datos y Redis

---

## 📋 Pasos para desplegar

### 1️⃣ Subir cambios a GitHub

```bash
git add render.yaml
git commit -m "Add Render configuration"
git push origin main
```

### 2️⃣ Crear el servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Haz clic en **"New +"** → **"Blueprint"**
3. Selecciona tu repositorio `certerusGarage`
4. Render detectará automáticamente el `render.yaml`
5. Haz clic en **"Apply"**

### 3️⃣ Configurar variables de entorno en Render

Después de crear el Blueprint, ve al servicio `certerus-backend` y configura:

#### 🔐 Base de datos (NeonDB)
Copia estos valores de tu panel de NeonDB:
```
DATABASE_HOST=tu-proyecto.neon.tech
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password
DATABASE_NAME=tu_base_de_datos
```

#### 📧 Email (SMTP)
Para Gmail:
```
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
```

**Nota:** Para Gmail, necesitas una [App Password](https://myaccount.google.com/apppasswords), no tu contraseña normal.

#### 🌐 Frontend URL
```
FRONTEND_URL=https://tu-frontend-url.com
```

---

## 🎯 Variables que se configuran automáticamente

Render configurará automáticamente:
- ✅ `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (del servicio Redis gratuito)
- ✅ `JWT_SECRET` (generado automáticamente)
- ✅ `NODE_ENV=production`
- ✅ `DATABASE_SSL=true`
- ✅ `REDIS_TLS=true`

---

## ⚙️ Configuración de Email SMTP Gratuito

### Opción 1: Gmail (Recomendado para testing)
1. Habilita 2FA en tu cuenta de Google
2. Crea una [App Password](https://myaccount.google.com/apppasswords)
3. Usa esa contraseña en `EMAIL_PASS`

### Opción 2: Brevo (ex SendinBlue) - GRATIS 300 emails/día
1. Regístrate en [Brevo](https://www.brevo.com/)
2. Ve a **SMTP & API** → **SMTP**
3. Copia las credenciales:
   ```
   EMAIL_USER=tu-email@brevo.com
   EMAIL_PASS=tu-smtp-key
   ```

### Opción 3: Resend - GRATIS 3,000 emails/mes
1. Regístrate en [Resend](https://resend.com/)
2. Crea una API key
3. **NOTA:** Resend usa API, no SMTP, así que necesitarías cambiar el código

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Redis"
- Asegúrate de que el servicio `certerus-redis` está corriendo
- Verifica que `REDIS_TLS=true` está configurado

### Error: "Cannot connect to database"
- Verifica las credenciales de NeonDB
- Asegúrate de que `DATABASE_SSL=true`
- Verifica que tu IP no está bloqueada en NeonDB (configura para permitir todas las IPs)

### Error: "Module not found"
- Asegúrate de que `package.json` tiene todas las dependencias
- Render ejecutará `npm install && npm run build` automáticamente

### El servicio se duerme (plan gratuito)
- El tier gratuito de Render duerme después de 15 minutos de inactividad
- Se despierta automáticamente cuando recibe una petición (puede tardar ~30 segundos)

---

## 📊 Limitaciones del tier gratuito

| Servicio | Limitación |
|----------|-----------|
| Web Service | 750 horas/mes, se duerme tras 15 min inactividad |
| Redis | 25MB de RAM |
| NeonDB | 512MB de almacenamiento, 1 base de datos |

---

## 🔄 Actualizar el servicio

Cada vez que hagas `git push` a la rama `main`, Render:
1. ✅ Detectará los cambios automáticamente
2. ✅ Ejecutará `npm install && npm run build`
3. ✅ Reiniciará el servicio
4. ✅ Desplegará la nueva versión

---

## ✨ Siguiente paso

1. Ejecuta el commit y push de los cambios
2. Ve a Render y crea el Blueprint
3. Configura las variables de entorno
4. ¡Tu app estará funcionando en ~5 minutos!

**URL final:** `https://certerus-backend.onrender.com`
