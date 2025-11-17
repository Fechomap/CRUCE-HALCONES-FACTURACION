# INSTRUCCIONES DE USO - CRUCE-HALCONES

## ✅ Proyecto Compilado y Listo

El proyecto ha sido completamente desarrollado, compilado y está listo para usar.

## 📋 Prerrequisitos Completados

- ✅ Node.js instalado
- ✅ Dependencias instaladas
- ✅ TypeScript configurado
- ✅ ESLint y Prettier configurados
- ✅ Proyecto compilado exitosamente
- ✅ Archivo base copiado a `data/`

## 🚀 PASO 1: Configurar el Token de Telegram

1. Abre el archivo `.env` en la raíz del proyecto:

```bash
nano .env
```

2. Reemplaza `your_telegram_bot_token_here` con tu token de Telegram Bot:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

3. Guarda el archivo (Ctrl+O, Enter, Ctrl+X en nano)

### ¿Cómo obtener el token?

1. Abre Telegram y busca [@BotFather](https://t.me/botfather)
2. Envía el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. BotFather te dará un token, cópialo al archivo `.env`

## 🎯 PASO 2: Iniciar el Bot

### Opción A: Modo Desarrollo (recomendado para pruebas)

```bash
npm run dev
```

Este modo tiene hot-reload, se reiniciará automáticamente cuando hagas cambios.

### Opción B: Modo Producción

```bash
npm start
```

Este modo ejecuta el código compilado desde `dist/`.

### Opción C: Recompilar y ejecutar

```bash
npm run build
npm start
```

## 📱 PASO 3: Usar el Bot en Telegram

1. **Busca tu bot en Telegram** usando el nombre que le diste a @BotFather

2. **Inicia una conversación** con `/start`

3. **Verás un menú con botones:**
   - 🚀 Realizar Cruce
   - ℹ️ Información
   - 📊 Ver Último Reporte
   - ❓ Ayuda

4. **Para realizar un cruce:**
   - Presiona "🚀 Realizar Cruce"
   - Envía el archivo Excel de facturación (.xlsx)
   - Espera el procesamiento (automático)
   - Descarga los archivos generados:
     - `BASE_ACTUALIZADA.xlsx`
     - `REPORTE_CRUCE.txt`

## 📊 Estructura de Archivos

```
CRUCE-HALCONES/
├── src/               # Código fuente TypeScript
├── dist/              # Código compilado (generado)
├── data/              # Archivo base de cotejo
├── temp/              # Archivos temporales (se crean automáticamente)
├── logs/              # Logs del sistema (se crean automáticamente)
├── .env               # ⚠️ CONFIGURAR AQUÍ EL TOKEN
├── package.json       # Dependencias y scripts
└── README.md          # Documentación completa
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar en modo desarrollo (hot-reload)
npm run start:dev    # Iniciar sin hot-reload

# Producción
npm run build        # Compilar proyecto
npm start            # Ejecutar código compilado

# Calidad de código
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas automáticamente
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato
npm run type-check   # Verificar tipos TypeScript

# Limpieza
npm run clean        # Limpiar carpeta dist/
```

## ⚙️ Configuración Avanzada (Opcional)

El archivo `.env` permite configurar:

```env
# Token del bot (REQUERIDO)
TELEGRAM_BOT_TOKEN=tu_token_aqui

# Ambiente
NODE_ENV=development    # o 'production'

# Rutas (puedes cambiarlas si lo necesitas)
BASE_EXCEL_PATH=./data/BASE COTEJO TGH MAWDY.xlsx
TEMP_DIR=./temp
LOGS_DIR=./logs

# Límites
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=.xlsx
```

## 📝 Ejemplo de Uso Completo

1. **Terminal 1** - Iniciar el bot:
```bash
cd /Users/jhonvc/CRUCE-HALCONES
npm run dev
```

Verás:
```
═══════════════════════════════════════════════════════════════
  CRUCE-HALCONES - v1.0.0
  Sistema de Cruce de Facturación Automático
═══════════════════════════════════════════════════════════════

✅ Bot iniciado exitosamente
📡 Esperando mensajes...

Presiona Ctrl+C para detener el bot
```

2. **Telegram** - Usar el bot:
   - Busca tu bot
   - Envía `/start`
   - Presiona "🚀 Realizar Cruce"
   - Envía tu archivo de facturación
   - Descarga los resultados

## 🔍 Ver Logs

Los logs se guardan automáticamente:

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Ver solo errores
tail -f logs/error.log

# Ver últimas 50 líneas
tail -n 50 logs/combined.log
```

## ⚠️ Solución de Problemas

### El bot no responde

```bash
# 1. Verificar que el token es correcto
cat .env | grep TELEGRAM_BOT_TOKEN

# 2. Verificar que el bot está corriendo
# (debe estar ejecutándose en otra terminal)

# 3. Ver logs de error
tail -n 20 logs/error.log
```

### Error al compilar

```bash
# Limpiar y recompilar
npm run clean
npm install
npm run build
```

### Error al procesar archivo

1. Verifica que el archivo sea .xlsx (no .xls)
2. Verifica que tenga las columnas requeridas:
   - EXPEDIENTE
   - Folio 1
   - Factura 1
   - Monto 1
3. Verifica que el tamaño sea menor a 10MB

## 🎨 Calidad de Código

El proyecto incluye ESLint y Prettier para mantener un código limpio:

```bash
# Antes de hacer commits, ejecuta:
npm run lint        # Verifica errores
npm run format      # Formatea el código
npm run type-check  # Verifica tipos
```

## 🔄 Actualizar Archivo Base

Si necesitas actualizar el archivo base de cotejo:

```bash
# Reemplazar el archivo en data/
cp "nuevo_archivo.xlsx" data/"BASE COTEJO TGH MAWDY.xlsx"
```

O edita la ruta en `.env`:
```env
BASE_EXCEL_PATH=./data/MI_NUEVO_ARCHIVO.xlsx
```

## 📦 Despliegue en Servidor

Para ejecutar en un servidor:

```bash
# 1. Compilar
npm run build

# 2. Ejecutar con PM2 (recomendado)
npm install -g pm2
pm2 start dist/index.js --name "cruce-halcones"
pm2 save
pm2 startup

# O con nohup
nohup npm start > output.log 2>&1 &
```

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en `logs/`
2. Verifica la configuración en `.env`
3. Asegúrate de que el archivo base existe en `data/`
4. Verifica que Node.js sea versión 18+

## ✅ Checklist de Verificación

- [ ] Token de Telegram configurado en `.env`
- [ ] Archivo base en `data/BASE COTEJO TGH MAWDY.xlsx`
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto compilado (`npm run build`)
- [ ] Bot iniciado (`npm run dev` o `npm start`)
- [ ] Bot responde en Telegram

---

**¡Listo para usar!** 🚀

El bot está completamente configurado y compilado. Solo necesitas:
1. Agregar tu token de Telegram en `.env`
2. Ejecutar `npm run dev`
3. Usar el bot en Telegram

**Desarrollado para HALCONES** 🦅
