# Contrato de Datos — APTKI Workstation

> Documento inmutable que define la estructura exacta de los payloads que fluyen entre módulos.
> Cualquier módulo que consuma `AnalysisResult` DEBE leer este documento.

---

## 1. `ParsedLedger` — Salida de `parser.js → parseLedgerFile()`

```javascript
{
  meta: {
    fileName: string,        // Nombre del archivo .xlsx cargado
    sheets: string[],        // Nombres de las hojas encontradas
    months: string[],        // Claves de mes ordenadas, ej. ["2026-01", "2026-02"]
    totalEntries: number,    // Total de filas parseadas
    totalCuentas: number     // Cuentas únicas detectadas
  },
  entries: Entry[],          // Array de asientos normalizados
  byMonth: { [monthKey: string]: Entry[] },
  anomalies: Anomaly[]      // Anomalías detectadas por el parser (nivel 1)
}
```

### `Entry`
```javascript
{
  sheet: string,             // Nombre de la hoja de origen
  monthKey: string,          // "YYYY-MM"
  fecha: string | null,      // ISO date "YYYY-MM-DD" o null
  asiento: string,           // Número o código del asiento
  cuenta: string,            // Código PGC (ej. "700000")
  grupo: string,             // Primer dígito (ej. "7")
  subgrupo: string,          // Dos primeros dígitos (ej. "70")
  descripcion: string,       // Texto libre del asiento
  debe: number,              // Importe en el Debe (0 si vacío)
  haber: number              // Importe en el Haber (0 si vacío)
}
```

### `Anomaly`
```javascript
{
  severity: 'critical' | 'high' | 'medium' | 'low',
  message: string,           // Título corto del hallazgo
  detail: string,            // Descripción técnica
  month?: string             // Mes afectado (opcional, solo parser-level)
}
```

---

## 2. `AnalysisResult` — Salida de `analyzer.js → analyzeLedger()`

```javascript
{
  meta: {
    fileName: string,        // Nombre del archivo .xlsx cargado
    sheets: string[],        // Hojas procesadas
    months: string[],        // Meses ordenados cronológicamente
    totalEntries: number,    // Total de asientos
    totalCuentas: number     // Cuentas únicas
  },
  anomalies: Anomaly[],      // Fuente canónica de todas las anomalías combinadas (parser + analyzer)
  confidence: {
    trustScore: number,              // Puntuación de confianza contable (0-100)
    confidenceLevel: 'reliable' | 'reservations' | 'indicative' | 'blocked',
    confidenceLabel: string,         // Texto descriptivo del nivel de confianza
    forecastMode: 'normal' | 'cautious' | 'conservative' | 'simulation',
    scoringPenalty: number,          // Penalización aplicada al scoring (0-25)
    ebitdaSuspect: boolean,          // true si hay ≥3 anomalías high o critical
    analysisLimitations: string[],   // Advertencias y limitaciones textuales
    fundingReadinessFlags: {
      scoringDefensible: boolean,    // Apto para scoring público
      forecastDefensible: boolean,   // Apto para proyecciones
      narrativeConclusive: boolean,  // Apto para informe de narrativa concluyente
      requiresManualReview: boolean  // Requiere limpieza/revisión manual
    },
    auditReasons: string[]           // Bitácora detallada de los ajustes aplicados al score
  },
  totales: {
    ingresos: number,        // Suma total de ingresos
    gastos: number,          // Suma total de gastos operativos
    ebitda: number,          // Suma total de EBITDA
    resultado: number,       // Suma total de Resultado Neto
    cogs: number,            // Suma total de Coste de Ventas
    cajaFinal: number,       // Saldo de tesorería final (mínimo 0)
    burnRateNeto: number,    // Ritmo de consumo de caja neto promedio por mes
    gastosPorGrupo: { [subgrupo: string]: number }, // Gastos agregados por subgrupo PGC
    saldoCuenta: { [cuenta: string]: number }       // Saldo neto por cuenta PGC (haber - debe)
  },
  balance: {
    cajaFinal: number,
    activoCorriente: number,
    activoNoCorriente: number,
    activoTotal: number,
    pasivoCorriente: number,
    pasivoNoCorriente: number,
    pasivoTotal: number,
    patrimonioNeto: number
  },
  pygMensual: {
    [monthKey: string]: {
      ventas: number,
      otrosIngresos: number,
      totalIngresos: number,
      cogs: number,
      margenBruto: number,
      personal: number,
      marketing: number,
      serviciosOperativos: number,
      tributos: number,
      ebitda: number,
      amortizacion: number,
      ebit: number,
      gastosFinancieros: number,
      resultadoNeto: number,
      cajaSaldo: number
    }
  },
  byMonth: { [monthKey: string]: Entry[] },
  lastMonth: string,
  lastMonthEntries: Entry[],
  categoryMap: { [cuenta: string]: string }
}
```

### Notas de Migración (Fase 5)
- **Fuente de Verdad de Anomalías:** Post-análisis, la fuente canónica es `AnalysisResult.anomalies`. `ParsedLedger.anomalies` solo debe usarse para errores de parseo crudo.
- **Bloque Confidence:** Centraliza toda la lógica de fiabilidad. Ningún módulo (Scorer, Forecaster) debe calcular umbrales; deben consumir este bloque.

---

## 3. Consumidores

| Módulo | Campo(s) consumidos | Notas |
|--------|---------------------|-------|
| `app.js` (Dashboard) | `totales.*`, `pygMensual`, `confidence.trustScore`, `confidence.ebitdaSuspect` | Renderiza KPIs, PyG, Trust Score |
| `narrative.js` | `totales.ingresos`, `totales.gastos`, `totales.ebitda`, `totales.cajaFinal`, `totales.burnRateNeto`, `pygMensual` | Genera texto analítico |
| `scorer.js` | `totales.ingresos`, `totales.ebitda`, `totales.resultado`, `balance.*`, `totales.cajaFinal` | Scoring ENISA/CDTI |
| `forecaster.js` | `pygMensual`, `totales.ingresos`, `totales.gastos`, `lastMonth`, `lastMonthEntries` | Proyección 12M |
| `exporter.js` | Todo el `AnalysisResult` + `STATE.parsedLedger.anomalies` | Export Excel/PDF |
| `session.js` | `STATE.parsedLedger`, `STATE.analysisResult`, `STATE.auditTrail` | Persistencia .aptki |

---

## 4. Invariantes

- `totales.gastos` **siempre** incluye: `cogs + personal + marketing + serviciosOperativos + tributos + amortizacion + gastosFinancieros`.
- `totales.ebitda` **nunca** incluye amortización ni gastos financieros.
- `trustScore` se calcula **después** de ejecutar `runAnomalyEngine()`, por lo que refleja TODAS las anomalías (parser + analyzer).
- `ebitdaSuspect` es `true` cuando `count(severity ∈ {high, critical}) >= 3`.
- `balance` puede tener valores a 0 si el libro no contiene cuentas de balance (grupos 1-5).
