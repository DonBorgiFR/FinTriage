# Especificación del Formato de Sesión .aptki

El formato de sesión `.aptki` es un archivo de persistencia local basado en JSON unificado que permite a los consultores de APTKI guardar, compartir y retomar sus análisis sin necesidad de almacenamiento en la nube ni bases de datos activas en el navegador.

El sistema soporta de forma nativa e integrada dos esquemas según el modo de operación (`single` o `portfolio`).

---

## 1. Esquema de Empresa Única (`mode: "single"`)

Este archivo representa el estado completo de un análisis individual de un cliente. Se genera automáticamente al exportar la sesión desde las vistas de Dashboard, Checklist o Cockpit de Defensa.

### Estructura del Objeto JSON

```json
{
  "version": "1.2",
  "timestamp": "2026-05-19T20:15:30.123Z",
  "mode": "single",
  "empresa": {
    "nombre": "Startup Ficticia S.L.",
    "sector": "Software SaaS",
    "empleados": 12
  },
  "selectedProfileId": "saas",
  "parsedLedger": {
    "meta": {
      "fileName": "diario_2025.xlsx",
      "rowCount": 1420,
      "dateStart": "2025-01-01",
      "dateEnd": "2025-12-31"
    },
    "entries": [
      {
        "fecha": "2025-01-15",
        "asiento": "1",
        "cuenta": "43000001",
        "concepto": "Factura Venta 01",
        "debe": 1210.00,
        "haber": 0.00
      }
    ],
    "byMonth": {
      "2025-01": {
        "ingresos": 1000.00,
        "gastos": 800.00
      }
    },
    "anomalies": []
  },
  "customMapping": {
    "70500000": "ventas",
    "62900000": "servicios"
  },
  "extraInputs": {
    "cajaInicial": 45000,
    "burnRateEstimado": 12000
  },
  "scoringInputs": {
    "coherenciaCuentas": 4,
    "calidadEquipo": 5
  },
  "approvedAccruals": [
    {
      "id": "acc_01",
      "descripcion": "Seguro anual prorrateado",
      "total": 1200.00,
      "meses": 12,
      "mesInicio": "2025-01"
    }
  ],
  "forecastScenario": "base",
  "contextChecklist": {
    "chk_01": true,
    "chk_02": false
  },
  "auditTrail": [
    {
      "timestamp": "2026-05-19T20:01:00.000Z",
      "action": "Carga de libro diario",
      "details": "Archivo diario_2025.xlsx procesado con 1420 filas."
    }
  ],
  "defensaPlanChoqueChecked": [
    "p1",
    "p3"
  ],
  "defensaSimulacionInputs": {
    "dsoObjetivo": 60,
    "dpoObjetivo": 45,
    "ahorroGastos": 15
  }
}
```

### Propiedades Clave:
*   `version`: Identificador del esquema para controlar retrocompatibilidad.
*   `mode`: Debe ser `"single"`.
*   `parsedLedger`: Estructura extraída de SheetJS limpia y libre de metadatos de DOM.
*   `customMapping`: Mapeo explícito que el consultor modificó en la UI para reclasificar cuentas del PGC.
*   `approvedAccruals`: Lista de periodificaciones aplicadas sobre el EBITDA.
*   `defensaSimulacionInputs`: Parámetros configurados en la simulación interactiva del cockpit de supervivencia.

---

## 2. Esquema de Cartera Multicompañía (`mode: "portfolio"`)

Este archivo unifica múltiples startups en un solo lote agregando las sesiones individuales completas. Permite guardar la cartera completa de startups analizadas por un consultor para recargar el panel principal de control en un único paso.

### Estructura del Objeto JSON

```json
{
  "version": "1.2",
  "timestamp": "2026-05-19T20:30:00.000Z",
  "mode": "portfolio",
  "startups": [
    {
      "nombre": "Startup Ficticia S.L.",
      "arquetipo": "SaaS",
      "selectedProfileId": "saas",
      "sessionData": {
        "version": "1.2",
        "timestamp": "2026-05-19T20:15:30.123Z",
        "mode": "single",
        "empresa": {
          "nombre": "Startup Ficticia S.L.",
          "sector": "Software SaaS",
          "empleados": 12
        },
        "parsedLedger": {},
        "customMapping": {},
        "extraInputs": {},
        "scoringInputs": {},
        "approvedAccruals": [],
        "forecastScenario": "base",
        "contextChecklist": {},
        "auditTrail": [],
        "defensaPlanChoqueChecked": [],
        "defensaSimulacionInputs": {}
      }
    }
  ]
}
```

### Propiedades Clave:
*   `mode`: Debe ser `"portfolio"`.
*   `startups`: Array de objetos que encapsulan cada empresa.
    *   `nombre`: Nombre comercial para renderizado rápido.
    *   `arquetipo`: Arquetipo de negocio de la compañía (SaaS, Industrial, Servicios, General).
    *   `selectedProfileId`: Perfil de negocio asignado para reglas de consistencia contable.
    *   `sessionData`: Payload completo equivalente al formato `single` de esa startup. Esto permite extraer cualquier startup de la cartera y transicionar de forma limpia al análisis individual del dashboard cargando todo su estado contable intacto.
