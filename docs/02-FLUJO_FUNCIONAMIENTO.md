# FLUJO CORRECTO DEL BOT - CRUCE-HALCONES

## ⚠️ IMPORTANTE: FUNCIONAMIENTO DEL BOT

El bot funciona con un flujo de **2 archivos Excel**:

```
Usuario → Excel 1 (FACTURACIÓN) → Excel 2 (BASE) → Bot cruza 1→2 → Usuario recibe Excel 2 actualizado
```

## 📋 Proceso Paso a Paso

### PASO 1: Iniciar Cruce
El usuario presiona el botón "🚀 Realizar Cruce" o envía `/cruce`

**Bot responde:**
```
📤 PASO 1/2: Envía el Excel de FACTURACIÓN

Este es el archivo que contiene los datos que se van a cruzar.

Debe contener las columnas:
• EXPEDIENTE
• Folio 1, Factura 1, Monto 1

📎 Formato: .xlsx | Máx: 10MB
```

### PASO 2: Usuario envía Excel 1 (Facturación)
El usuario envía el archivo Excel que contiene toda la información de facturación.

**Características del Excel 1:**
- Contiene EXPEDIENTES ya facturados
- Columnas requeridas:
  - EXPEDIENTE (9 dígitos)
  - Folio 1, Factura 1, Monto 1
  - Opcionalmente: Folio 2-5, Factura 2-5, Monto 2-5

**Bot valida y responde:**
```
✅ Archivo de facturación recibido: nombre_archivo.xlsx

📤 PASO 2/2: Envía el Excel BASE

Este es el archivo donde se cruzará la información del archivo anterior.

📎 Formato: .xlsx | Máx: 10MB
```

### PASO 3: Usuario envía Excel 2 (Base)
El usuario envía el archivo Excel base donde se cruzará la información.

**Características del Excel 2:**
- Archivo base de la operación (puede tener más columnas)
- Debe contener columna EXPEDIENTE
- Este archivo será el que se actualizará y regresará

**Bot procesa:**
```
✅ Archivo base recibido: nombre_base.xlsx

⏳ Realizando cruce de información...

Esto puede tomar un momento.
```

### PASO 4: Bot realiza el cruce

**Proceso interno:**
1. Lee Excel 1 (Facturación)
2. Lee Excel 2 (Base)
3. **CRUZA**: Por cada expediente en Excel 1, busca en Excel 2
4. **ACTUALIZA**: Inserta los datos de facturación en Excel 2
5. **VALIDA**: Detecta duplicados, discrepancias, expedientes no encontrados

### PASO 5: Bot entrega resultados

**Usuario recibe:**
1. ✅ **Excel 2 ACTUALIZADO** (con la información de facturación ya cruzada)
2. 📄 **Reporte detallado** (.txt) con estadísticas del cruce

**Resumen en Telegram:**
```
✅ CRUCE COMPLETADO

📊 Resumen:
• Expedientes procesados: 54
• Coincidencias: 49
• Duplicados: 5
• Sin facturar: 3
• Discrepancias: 46

💰 Monto facturado: $144,579.45

📥 Archivos generados:
1️⃣ BASE_ACTUALIZADA.xlsx
2️⃣ REPORTE_CRUCE.txt
```

## 🔄 Dirección del Cruce (MUY IMPORTANTE)

```
     EXCEL 1                    EXCEL 2
   (Facturación)    ──────>    (Base)

   Datos origen               Destino

   Se lee                     Se actualiza y regresa
```

### ❌ NO FUNCIONA ASÍ:
```
EXCEL 2  ─X─>  EXCEL 1   (INCORRECTO)
```

### ✅ SÍ FUNCIONA ASÍ:
```
EXCEL 1  ───>  EXCEL 2   (CORRECTO)
```

## 📊 Ejemplo Práctico

### Escenario Real:

**Excel 1 (Facturación)** - `FACTURACION_OCTUBRE.xlsx`
```
EXPEDIENTE  | Folio 1   | Factura 1 | Monto 1
125286115   | 20380889  | TGH5313   | $325.00
125272698   | 20349590  | TGH5313   | $325.00
```

**Excel 2 (Base)** - `BASE_COTEJO_TGH.xlsx`
```
EXPEDIENTE  | Aseguradora | Vehículo | TOTAL  | Folio 1 | Factura 1 | Monto 1
125286115   | GNP         | TSURU    | $448   | (vacío) | (vacío)   | 0
125272698   | MAPFRE      | VERSA    | $364   | (vacío) | (vacío)   | 0
```

**Resultado - Excel 2 ACTUALIZADO:**
```
EXPEDIENTE  | Aseguradora | Vehículo | TOTAL  | Folio 1   | Factura 1 | Monto 1
125286115   | GNP         | TSURU    | $448   | 20380889  | TGH5313   | $325.00
125272698   | MAPFRE      | VERSA    | $364   | 20349590  | TGH5313   | $325.00
```

**El usuario recibe** el Excel 2 actualizado (BASE_ACTUALIZADA.xlsx)

## 🚨 Casos Especiales

### 1. Expediente en Excel 1 NO existe en Excel 2
**Resultado:** Se reporta en el reporte como "No encontrado"
**Acción:** No se actualiza nada, se alerta al usuario

### 2. Expediente duplicado en Excel 2
**Resultado:** Se actualiza TODOS los registros con ese expediente
**Acción:** Se reporta como duplicado

### 3. Expediente en Excel 2 sin datos en Excel 1
**Resultado:** Se mantiene sin cambios
**Acción:** Se reporta como "Sin facturación"

## 💾 Almacenamiento

**SIN BASE DE DATOS:**
- Todo se procesa en memoria
- Los archivos temporales se eliminan después del proceso
- No hay persistencia de datos

**Archivos generados se guardan temporalmente en:**
```
temp/
├── BASE_ACTUALIZADA_<userId>_<id>.xlsx
└── REPORTE_<userId>_<id>.txt
```

## 🎯 Resumen del Flujo Completo

1. **Usuario inicia:** `/cruce` o botón "Realizar Cruce"
2. **Bot pide:** Excel 1 (Facturación)
3. **Usuario envía:** Excel 1
4. **Bot valida:** Excel 1 es correcto
5. **Bot pide:** Excel 2 (Base)
6. **Usuario envía:** Excel 2
7. **Bot valida:** Excel 2 es correcto
8. **Bot procesa:** Cruce Excel 1 → Excel 2
9. **Bot genera:** Excel 2 actualizado + Reporte
10. **Bot envía:** Archivos al usuario
11. **Usuario descarga:** Excel 2 actualizado

## ⚡ Diferencias con el Flujo Anterior

### ❌ ANTES (Incorrecto):
- Bot tenía un archivo base local
- Usuario enviaba solo 1 archivo (facturación)
- Bot cruzaba contra archivo local
- Bot retornaba archivo local actualizado

### ✅ AHORA (Correcto):
- Usuario envía 2 archivos
- Excel 1: Facturación (datos origen)
- Excel 2: Base (destino, se actualiza)
- Bot cruza 1 → 2
- Bot retorna Excel 2 actualizado

## 🔒 Reglas Estrictas

1. **Siempre** Excel 1 → Excel 2 (nunca al revés)
2. **Siempre** se retorna solo Excel 2 actualizado
3. **Siempre** se mantiene integridad de Excel 2
4. **Nunca** se modifica Excel 1
5. **Nunca** se cruza en dirección inversa

---

**Este flujo garantiza:**
- ✅ Flexibilidad (usuario controla ambos archivos)
- ✅ Seguridad (no se sobrescribe archivo local)
- ✅ Claridad (flujo 1→2 explícito)
- ✅ Control (usuario decide qué cruzar con qué)

**Desarrollado para HALCONES** 🦅
