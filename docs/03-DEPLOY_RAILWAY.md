# 🚂 Despliegue en Railway - CRUCE-HALCONES

## Pasos para Desplegar en Railway

### 1. Preparar el Proyecto

El proyecto ya está configurado para Railway con:
- ✅ `railway.json` - Configuración de build y deploy
- ✅ `Procfile` - Comando de inicio
- ✅ `package.json` - Scripts de build configurados
- ✅ `.env` - Variables de entorno (token incluido)

### 2. Inicializar Git (si no está inicializado)

```bash
git init
git add .
git commit -m "Initial commit - CRUCE-HALCONES bot"
```

### 3. Crear Proyecto en Railway

#### Opción A: Desde CLI (recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Configurar variables de entorno
railway variables set TELEGRAM_BOT_TOKEN=<TU_TOKEN_AQUI>
railway variables set NODE_ENV=production

# Desplegar
railway up
```

#### Opción B: Desde Dashboard Web

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio
5. Railway detectará automáticamente Node.js

### 4. Configurar Variables de Entorno en Railway

En el Dashboard de Railway, ve a Variables y agrega:

```env
TELEGRAM_BOT_TOKEN=<TU_TOKEN_AQUI>
NODE_ENV=production
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=.xlsx
```

### 5. Configurar el Build

Railway usará automáticamente:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 6. Deploy Automático

Railway desplegará automáticamente cada vez que hagas push al repositorio:

```bash
git add .
git commit -m "Update bot"
git push
```

## Verificación del Despliegue

### 1. Ver Logs

```bash
# Desde CLI
railway logs

# O desde el Dashboard web
# Ve a tu proyecto → Deployments → Logs
```

### 2. Verificar que el Bot Está Corriendo

Busca en los logs:

```
✅ Bot iniciado exitosamente
📡 Esperando mensajes...
```

### 3. Probar el Bot en Telegram

1. Busca tu bot en Telegram
2. Envía `/start`
3. Deberías ver el menú con botones

## Troubleshooting

### El bot no responde

```bash
# Ver logs
railway logs --follow

# Verificar variables de entorno
railway variables
```

### Error de compilación

```bash
# Verificar build local primero
npm run build

# Si funciona local, limpiar caché de Railway
railway redeploy
```

### Error de memoria

Railway da 512MB por defecto. Si necesitas más:
1. Ve al Dashboard
2. Settings → Plan
3. Upgrade si es necesario

## Configuración Avanzada

### Healthcheck (Opcional)

Railway puede hacer healthchecks. Agrega endpoint de salud:

```typescript
// En src/index.ts
import http from 'http';

// Crear servidor HTTP simple para healthcheck
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

healthServer.listen(process.env.PORT || 3000);
```

### Persistencia de Logs

Los logs en Railway son temporales. Para persistencia:
1. Usar servicio externo (Logtail, Papertrail)
2. O configurar database para logs

## Monitoreo

### Métricas Incluidas en Railway

- CPU usage
- Memory usage
- Restart count
- Response time

### Alertas

Configura en Railway Dashboard:
1. Settings → Notifications
2. Agrega webhook para alertas de Telegram/Slack

## Costos Estimados

Railway tiene:
- **Tier Free**: $5 de crédito mensual
- **Hobby Plan**: $5/mes
- **Pro Plan**: $20/mes

Este bot debería funcionar bien en el tier Free para uso moderado.

## Backup

Para hacer backup de configuración:

```bash
# Exportar variables
railway variables > railway-vars.env

# Backup del código
git push
```

## Comandos Útiles de Railway

```bash
# Ver status
railway status

# Ver logs en tiempo real
railway logs --follow

# Abrir dashboard
railway open

# Ver variables
railway variables

# Redeploy
railway redeploy

# Shell en el contenedor
railway run bash
```

## Notas Importantes

1. **Token de Telegram**: Ya está configurado en `.env`
2. **Build automático**: Railway compila TypeScript automáticamente
3. **Reinicio automático**: Configurado con política de retry
4. **Logs**: Se guardan por 7 días en Railway
5. **Escalabilidad**: Railway escala automáticamente si es necesario

## Checklist de Despliegue

- [ ] Proyecto inicializado en Railway
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Bot respondiendo en Telegram
- [ ] Logs verificados
- [ ] Alertas configuradas (opcional)
- [ ] Monitoreo activo

---

**El bot ya está listo para Railway con el token configurado!**

Solo necesitas:
1. `railway init`
2. `railway up`
3. Verificar logs con `railway logs`

**Desarrollado para HALCONES** 🦅
