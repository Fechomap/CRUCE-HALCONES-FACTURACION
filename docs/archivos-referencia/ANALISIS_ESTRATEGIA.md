# ANÁLISIS Y ESTRATEGIA - SISTEMA DE CRUCE DE FACTURACIÓN

## 1. ANÁLISIS DE ARCHIVOS

### ARCHIVO 1: EJEMPLO COTEJO FACTURACION.xlsx
**Propósito**: Contiene información de expedientes ya facturados

**Características**:
- 54 registros (expedientes facturados)
- 18 columnas
- Estructura: Expediente con hasta 5 facturas posibles

**Columnas clave**:
- `EXPEDIENTE` (int64): Clave primaria única (100% unicidad) - 9 dígitos
- `Folio 1, 2, 3, 4, 5` (int64/float64): Folios de facturas
- `Factura 1, 2, 3, 4, 5` (object): Número de factura
- `Monto 1, 2, 3, 4, 5` (float64): Monto facturado
- `Siniestro` (float64): **100% NULL** - no utilizable
- `Vehículo` (float64): **100% NULL** - no utilizable

**Patrón detectado**:
- Cada expediente puede tener múltiples facturas (hasta 5)
- La mayoría tiene solo 1 factura (Folio 1 siempre presente)
- 59% tiene 2 facturas
- 19% tiene 3 facturas
- Folios 4 y 5 están 100% vacíos

### ARCHIVO 2: BASE COTEJO TGH MAWDY.xlsx
**Propósito**: Base de datos operativa que necesita ser actualizada con la información de facturación

**Características**:
- 62 registros (servicios operativos)
- 77 columnas (información completa del servicio)
- Estructura: Servicio completo con datos operativos + campos de facturación vacíos

**Columnas clave**:
- `CONSE` / `CONSE .1` (int64): Consecutivo interno único
- `EXPEDIENTE` (int64): Clave para cruce (91.9% unicidad - algunos duplicados)
- `Folio 1-5, Factura 1-5, Monto 1-5`: **100% VACÍOS** - aquí se insertará la información
- `Siniestro`: **100% NULL**
- `COBRADO // FACTURADO` (int64): Actualmente todo en 0

**Datos adicionales importantes**:
- Información operativa completa: Operador, Grúa, Origen, Destino, Costos, etc.
- Fechas, tiempos, montos calculados
- Campo `DIFERENCIAS`: Para reportar discrepancias

## 2. ESTRATEGIA DE CRUCE

### CAMPO CLAVE PARA MATCHING
**EXPEDIENTE** será el campo principal de cruce entre ambos archivos

**Consideraciones**:
- Archivo 1: 54 expedientes únicos (100% unicidad)
- Archivo 2: 57 expedientes únicos de 62 registros (91.9% unicidad)
- Hay 5 expedientes duplicados en Archivo 2 que requieren atención especial

### PROCESO DE CRUCE

```
Para cada registro en ARCHIVO 1 (facturación):
  1. Buscar EXPEDIENTE en ARCHIVO 2
  2. Si encuentra coincidencia:
     - Copiar Folio 1-5 → Archivo 2
     - Copiar Factura 1-5 → Archivo 2
     - Copiar Monto 1-5 → Archivo 2
     - Marcar COBRADO // FACTURADO = 1 (o suma de montos)
     - Calcular DIFERENCIAS si aplica
  3. Si NO encuentra coincidencia:
     - Reportar expediente no encontrado
  4. Si encuentra múltiples coincidencias:
     - Reportar duplicado y aplicar a todos

Para cada registro en ARCHIVO 2 (base):
  Si después del cruce NO tiene datos de facturación:
     - Reportar como "No facturado" o "Pendiente"
```

## 3. CASOS ESPECIALES Y REPORTES

### 3.1. Expedientes del Archivo 1 NO encontrados en Archivo 2
**Problema**: Expediente facturado pero no existe en base operativa
**Acción**: Reportar para revisión manual

### 3.2. Expedientes duplicados en Archivo 2
**Problema**: Mismo expediente aparece múltiples veces
**Acción**: Aplicar facturación a todos los registros con ese expediente

### 3.3. Expedientes en Archivo 2 sin facturación
**Problema**: Servicio realizado pero no facturado
**Acción**: Mantener vacío, reportar en resumen

### 3.4. Validación de montos
**Verificar**: Si el monto facturado coincide razonablemente con el TOTAL del servicio
**Reportar**: Discrepancias significativas (>10% de diferencia)

## 4. ESTRUCTURA DE REPORTES

### Reporte de Cruce Exitoso
```
✅ Cruce completado exitosamente
📊 Estadísticas:
   - Expedientes procesados: 54
   - Coincidencias encontradas: X
   - Registros actualizados: X
   - Monto total facturado: $X,XXX.XX
```

### Reporte de No Encontrados
```
⚠️ Expedientes facturados NO encontrados en base operativa:
   - EXPEDIENTE: 125286115 | Folio: 20380889 | Monto: $325.00
   - EXPEDIENTE: 125272698 | Folio: 20349590 | Monto: $325.00
```

### Reporte de Duplicados
```
🔄 Expedientes duplicados en base operativa:
   - EXPEDIENTE: 125269306 (2 ocurrencias) - Facturación aplicada a ambas
```

### Reporte de Pendientes de Facturación
```
📋 Servicios sin facturación (pendientes):
   - EXPEDIENTE: 125269306 | Servicio: ASISTENCIA | Total: $3,924.34
   - Total pendientes: X expedientes | Monto: $X,XXX.XX
```

### Reporte de Discrepancias
```
⚠️ Discrepancias de montos:
   - EXPEDIENTE: 125269306
     Monto facturado: $325.00
     Total servicio: $3,924.34
     Diferencia: $3,599.34 (1107%)
```

## 5. CONSIDERACIONES TÉCNICAS

### 5.1. Formato de datos
- **Números de expediente**: Enteros de 9 dígitos (125XXXXXX)
- **Folios**: Enteros de 8 dígitos (20XXXXXX)
- **Facturas**: Strings (TGH5313, etc.)
- **Montos**: Float con 2 decimales

### 5.2. Manejo de valores NULL
- Archivo 1: Folios/Facturas/Montos vacíos = NULL
- Archivo 2: Campos de facturación actuales = NULL (se llenarán)
- Preservar otros campos como están

### 5.3. Validaciones necesarias
- ✅ EXPEDIENTE debe ser numérico de 9 dígitos
- ✅ Folios deben ser numéricos de 8 dígitos
- ✅ Montos deben ser positivos
- ✅ No sobrescribir datos si ya existen (preguntar)

## 6. ARQUITECTURA PROPUESTA EN TYPESCRIPT

### 6.1. Stack Tecnológico
```
- Node.js + TypeScript
- Telegraf (Bot de Telegram)
- ExcelJS (Manejo robusto de Excel)
- Zod (Validación de esquemas)
- Winston (Logging)
- Sin base de datos (procesamiento en memoria)
```

### 6.2. Estructura de módulos
```
src/
├── bot/
│   ├── handlers/          # Manejadores de comandos
│   ├── middleware/        # Middlewares de validación
│   └── bot.ts            # Instancia del bot
├── services/
│   ├── excel.service.ts   # Lectura/Escritura Excel
│   ├── matching.service.ts # Lógica de cruce
│   └── validation.service.ts # Validaciones
├── models/
│   ├── facturacion.model.ts
│   └── cotejo.model.ts
├── utils/
│   ├── reports.ts         # Generación de reportes
│   └── logger.ts          # Sistema de logs
└── index.ts
```

### 6.3. Flujo del Bot
```
1. Usuario envía Archivo 1 (Facturación) al bot
2. Bot valida estructura del archivo
3. Bot carga y procesa Archivo 1 en memoria
4. Bot lee Archivo 2 (Base local predefinida)
5. Bot ejecuta algoritmo de cruce
6. Bot genera reportes detallados
7. Bot actualiza Archivo 2 con nueva información
8. Bot envía:
   - Archivo 2 actualizado
   - Reporte de cruce en texto
   - Reporte de excepciones (si hay)
```

## 7. VENTAJAS DE LA ESTRATEGIA PROPUESTA

✅ **Sin base de datos**: Procesamiento en tiempo real, sin persistencia
✅ **Robusto**: Manejo de casos especiales y validaciones exhaustivas
✅ **Escalable**: Arquitectura modular preparada para crecer
✅ **TypeScript**: Type safety y mejor mantenibilidad
✅ **Reportes detallados**: Visibilidad completa del proceso
✅ **Flexible**: Puede manejar variaciones en estructura de Excel

## 8. OPCIONES AVANZADAS (SI ES NECESARIO)

### Opción A: ExcelJS (Recomendada)
- Librería robusta y madura
- Manejo completo de formatos Excel
- Sin dependencias externas pesadas
- **Recomendación**: Empezar con esta

### Opción B: Integración con IA (Mistral/Claude)
- Solo si la estructura de Excel varía significativamente
- Para análisis semántico de columnas
- Para matching inteligente cuando los nombres de columnas cambian
- **Cuándo usarla**: Si los archivos Excel no tienen estructura consistente

### Implementación con IA
```typescript
// Si las columnas varían, usar IA para identificarlas
const columnMapper = await aiService.identifyColumns(headers, [
  'EXPEDIENTE', 'Folio', 'Factura', 'Monto'
]);
```

## 9. SIGUIENTE PASO

¿Procedemos con la implementación en TypeScript usando ExcelJS?

O prefieres primero:
1. Ver un prototipo del algoritmo de cruce en Python
2. Implementar directamente en TypeScript con la arquitectura propuesta
3. Analizar más casos especiales en los archivos actuales
