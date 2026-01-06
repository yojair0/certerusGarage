# 🚀 CerterusGarage - Deployment Gratuito

## Stack 100% Gratuito

- **Backend**: Render (NestJS)
- **Database**: NeonDB (PostgreSQL)
- **Redis**: Render Redis
- **Frontend**: Vercel

## 🔧 Deployment

### 1. Subir a GitHub
```bash
git add .
git commit -m "Configure free deployment stack"
git push origin main
```

### 2. Desplegar en Render
1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click en **New +** → **Blueprint**
3. Selecciona el repositorio `certerusGarage`
4. Click en **Apply**
5. Espera 3-5 minutos

### 3. Verificar deployment
Tu backend estará disponible en:
- **URL**: `https://certerus-backend.onrender.com`

El frontend ya está en:
- **URL**: `https://garage-frontendd.vercel.app`

## 📋 Variables de Entorno

Todas las variables están configuradas en `render.yaml`:
- ✅ Base de datos (NeonDB)
- ✅ Redis (auto-generado)
- ✅ JWT Secret
- ✅ Email (Gmail)
- ✅ URLs del frontend

## ⚡ Features

- Deploy automático con cada `git push`
- SSL/TLS habilitado
- Redis incluido (25MB)
- PostgreSQL en NeonDB (512MB)
- Logs en tiempo real

## 🐛 Limitaciones Tier Gratuito

| Servicio | Limitación |
|----------|-----------|
| Render Web | Se duerme tras 15 min sin uso |
| Render Redis | 25MB RAM |
| NeonDB | 512MB storage |

## 📞 Support

Para más información, revisa [DEPLOY_RENDER.md](DEPLOY_RENDER.md)
