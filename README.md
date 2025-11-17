# CRUCE-HALCONES 🦅

Sistema automatizado de cruce de facturación para Telegram.

## Descripción

Bot de Telegram que permite cruzar automáticamente archivos de facturación con la base operativa, generando reportes detallados y archivos actualizados en tiempo real.

## Características

- ✅ **Procesamiento en tiempo real** - Sin base de datos, todo en memoria
- 📊 **Reportes detallados** - Estadísticas completas del cruce
- 🔄 **Detección de duplicados** - Identifica expedientes duplicados automáticamente
- ⚠️ **Validación de montos** - Alerta sobre discrepancias significativas
- 📱 **Interfaz interactiva** - Botones dinámicos para una mejor UX
- 🚀 **Arquitectura escalable** - Diseñado para crecer sin deuda técnica

## Tecnologías

- **Node.js** + **TypeScript 5**
- **Telegraf** - Framework para Telegram Bot API
- **ExcelJS** - Manejo robusto de archivos Excel
- **Zod** - Validación de esquemas y tipos
- **Winston** - Sistema de logging estructurado
- **date-fns** - Manejo de fechas

## Requisitos

- Node.js 18 o superior
- npm o yarn
- Token de Telegram Bot (obtener de [@BotFather](https://t.me/botfather))

## Instalación

1. **Clonar o usar el proyecto**

```bash
cd CRUCE-HALCONES
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Edita el archivo `.env` y agrega tu token de Telegram:

```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
```

4. **Verificar el archivo base**

Asegúrate de que el archivo `BASE COTEJO TGH MAWDY.xlsx` esté en la carpeta `data/`:

```bash
ls -la data/
```

## Uso

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

### Compilar el proyecto

```bash
npm run build
```

### Ejecutar en producción

```bash
npm start
```

### Verificar tipos TypeScript

```bash
npm run type-check
```

## Estructura del Proyecto

```
CRUCE-HALCONES/
├── src/
│   ├── bot/
│   │   ├── commands/          # Comandos del bot
│   │   ├── handlers/          # Manejadores de eventos
│   │   ├── middleware/        # Middlewares
│   │   └── bot.ts            # Configuración principal
│   ├── services/
│   │   ├── excel.service.ts   # Manejo de Excel
│   │   ├── matching.service.ts # Lógica de cruce
│   │   ├── validation.service.ts
│   │   └── report.service.ts  # Generación de reportes
│   ├── models/
│   │   ├── facturacion.model.ts
│   │   └── cotejo.model.ts
│   ├── utils/
│   │   ├── logger.ts          # Sistema de logs
│   │   ├── helpers.ts         # Funciones auxiliares
│   │   └── constants.ts       # Constantes
│   ├── config/
│   │   └── config.ts          # Configuración
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── index.ts               # Punto de entrada
├── data/                      # Archivo base
├── temp/                      # Archivos temporales
├── logs/                      # Logs del sistema
├── dist/                      # Código compilado
├── .env                       # Variables de entorno
├── tsconfig.json
├── package.json
└── README.md
```

## Comandos del Bot

- `/start` - Iniciar el bot y ver menú principal
- `/info` - Información sobre el sistema
- `/cruce` - Realizar un cruce de facturación
- `/reporte` - Ver el último reporte generado
- `/help` - Ayuda y documentación

## Flujo de Uso

1. **Iniciar el bot** con `/start` o presionar "Realizar Cruce"
2. **Enviar el archivo Excel** de facturación (.xlsx)
3. **Esperar el procesamiento** (automático)
4. **Recibir los archivos**:
   - `BASE_ACTUALIZADA.xlsx` - Base con información cruzada
   - `REPORTE_CRUCE.txt` - Reporte detallado
5. **Revisar alertas** si hay discrepancias o duplicados

## Formato de Archivos

### Archivo de Facturación (entrada)

Columnas requeridas:
- `EXPEDIENTE` - Número de expediente (9 dígitos)
- `Folio 1` - Folio de factura (8 dígitos)
- `Factura 1` - Número de factura
- `Monto 1` - Monto facturado

Columnas opcionales:
- `Folio 2-5`, `Factura 2-5`, `Monto 2-5` - Facturas adicionales

### Archivo Base (local)

Se actualiza automáticamente con la información de facturación.

## Reportes Generados

El sistema genera dos tipos de reportes:

### 1. Reporte en Telegram (visual)
- Estadísticas generales
- Monto total facturado
- Alertas de problemas
- Enlaces a archivos

### 2. Reporte Detallado (.txt)
- Estadísticas completas
- Expedientes no encontrados
- Duplicados detectados
- Discrepancias de montos (>10%)
- Servicios sin facturación

## Casos Especiales

### Expedientes Duplicados
Si un expediente aparece múltiples veces en la base, la facturación se aplica a **todos los registros**.

### Discrepancias de Monto
Se reportan diferencias mayores al 10% entre el monto facturado y el total del servicio.

### Expedientes No Encontrados
Se listan todos los expedientes facturados que no existen en la base operativa.

## Configuración Avanzada

### Variables de Entorno

```env
# Telegram
TELEGRAM_BOT_TOKEN=tu_token

# Ambiente
NODE_ENV=development|production

# Rutas
BASE_EXCEL_PATH=./data/BASE COTEJO TGH MAWDY.xlsx
TEMP_DIR=./temp
LOGS_DIR=./logs

# Límites
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=.xlsx
```

### Logging

Los logs se guardan en:
- `logs/combined.log` - Todos los eventos
- `logs/error.log` - Solo errores

Niveles: error, warn, info, debug

## Mantenimiento

### Limpiar archivos temporales

```bash
rm -rf temp/*
```

### Ver logs recientes

```bash
tail -f logs/combined.log
```

### Actualizar archivo base

Reemplaza el archivo en `data/BASE COTEJO TGH MAWDY.xlsx`

## Troubleshooting

### El bot no responde

1. Verifica que el token sea correcto en `.env`
2. Revisa los logs en `logs/error.log`
3. Asegúrate de que el bot esté corriendo

### Error al procesar archivo

1. Verifica que el archivo sea .xlsx
2. Confirma que tenga las columnas requeridas
3. Revisa que el tamaño sea menor a 10MB

### Archivo base no encontrado

1. Verifica que exista en `data/`
2. Confirma el nombre exacto del archivo
3. Revisa la ruta en `.env`

## Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar producción
npm run start:dev    # Ejecutar desarrollo sin watch
npm run clean        # Limpiar dist/
npm run type-check   # Verificar tipos
```

## Contribuir

Este proyecto sigue una arquitectura limpia y escalable. Para contribuir:

1. Mantén la separación de responsabilidades
2. Usa TypeScript con tipos estrictos
3. Agrega logs apropiados
4. Documenta funciones complejas
5. Sigue el estilo de código existente

## Licencia

MIT

## Soporte

Para problemas o preguntas:
- Revisa los logs en `logs/`
- Verifica la configuración en `.env`
- Contacta al equipo de desarrollo

---

**Desarrollado para HALCONES** 🦅
