# FinTriage — Roadmap de Análisis de Balance (Balance Sheet & Liquidity)

Este documento detalla la brecha funcional identificada en el motor financiero de FinTriage (anteriormente centrado predominantemente en Pérdidas y Ganancias / PyG) y traza el plan de desarrollo para evolucionar la herramienta hacia un **CFO Toolkit completo** de control de gestión.

## 📊 Diagnóstico y Brecha Funcional

El análisis financiero de liquidez y "triage" de caja no puede limitarse únicamente al comportamiento de la cuenta de resultados (PyG). Para evaluar con rigor institucional la salud financiera de una startup o pyme, es indispensable auditar la estructura del **Balance de Situación**, controlando la integridad de las cuentas patrimoniales y su impacto en el capital de trabajo.

### Puntos Críticos a Incorporar:
1. **Consistencia de Partida Doble ("O cuadra o no cuadra")**:
   * Asegurar la validación del balance de sumas y saldos.
   * Implementar alertas automáticas de descuadre contable a nivel de asientos y saldos consolidados.
2. **Análisis de Capital de Trabajo (Working Capital)**:
   * Control y cálculo en tiempo real de ratios de circulante: Fondo de Maniobra, Necesidades Operativas de Fondos (NOF) y Periodo Medio de Maduración.
   * Auditoría de las cuentas de deudores comerciales (clientes) y acreedores comerciales (proveedores) para detectar mermas en los ciclos de cobro/pago.
3. **Perfil de Vencimiento de Deuda (Maturity Profile)**:
   * Análisis temporal del pasivo exigible, clasificando la deuda financiera según su exigibilidad a corto plazo (pasivo corriente) y largo plazo (pasivo no corriente).
   * Alertas automáticas ante concentración excesiva de vencimientos en los próximos 12 meses.
4. **Indicadores de Deuda Neta e Insolvencia**:
   * Cálculo del ratio de Deuda Neta / EBITDA y Deuda Neta / Fondos Propios.
   * Implementación de indicadores avanzados de solvencia, liquidez inmediata (acid test) y autonomía financiera.
5. **Trazabilidad y Drill-down de Indicadores**:
   * Permitir que el usuario haga click sobre cualquier ratio financiero (por ejemplo, el scoring o runway) para ver el desglose exacto de las cuentas contables del balance que lo alimentan. Esto evitará el efecto "caja negra" y facilitará la auditoría visual de los datos.

---

## 🛠️ Plan de Implementación (Roadmap)

### Fase 1: Motor de Integridad y Partida Doble
* [ ] Integrar validación estricta de saldos iniciales y sumas del balance en `analyzer.js`.
* [ ] Generar anomalías de nivel **Crítico** en la ingesta ante descuadres entre Debe y Haber en el acumulado global.

### Fase 2: Mapeo Patrimonial (Cuentas de Balance)
* [ ] Añadir soporte en `store.js` y `profiles.js` para mapear cuentas de los grupos 1, 2, 3, 4 y 5 del PGC.
* [ ] Desarrollar una interfaz de mapeo secundario en la pestaña "Mapeo" enfocada en pasivo financiero y circulante.

### Fase 3: Ratios Avanzados de Solvencia y Deuda
* [ ] Calcular Deuda Neta: `(Cuentas 52 + 17) - Cuentas 57`.
* [ ] Incorporar el Fondo de Maniobra al diagnóstico ejecutivo de la pestaña "Dashboard".
* [ ] Dibujar un gráfico interactivo con el perfil de vencimiento de la deuda comercial y financiera en la pestaña "Defensa".
