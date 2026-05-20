# Plan de Validación Manual — Fase 8 (Control de Cartera)

Este documento detalla los 5 casos de prueba (Test Cases) esenciales para verificar manualmente la integridad, consistencia lógica y correcto comportamiento UX/UI del módulo de **Priorización de Cartera y Routing Interno (Fase 8)**.

---

## Caso de Prueba 1: Ingesta en Lote de Sesiones .aptki

### Objetivo:
Verificar que la ingesta múltiple de archivos `.aptki` reconstruye de forma correcta y reactiva la tabla de control de la cartera.

### Pasos:
1. Navegar a la pestaña **Cartera** en el menú superior o arrastrar los archivos en la pantalla principal.
2. Hacer clic en **Importar Sesión / Cartera (.aptki)**.
3. Seleccionar de forma simultánea de 2 a 4 archivos `.aptki` previamente guardados o cargar un archivo consolidado de cartera (`cartera_aptki_xxxx.aptki`).
4. Comprobar que la vista cambia automáticamente a la pestaña **Cartera Multicompañía**.
5. Verificar que la tabla muestra las filas correspondientes con el nombre, arquetipo, Runway, Trust Score, Foco Principal, Bloqueador, Ruta y Semáforo de Urgencia correctos.

### Resultado Esperado:
La UI reacciona sin retraso. Las celdas se colorean condicionalmente (ej. Rojo 🔴 para prioridades críticas, Amarillo 🟡 para intermedias, Verde 🟢 para estables) y no se produce ningún error de consola.

---

## Caso de Prueba 2: Selección y Copiado de Ficha Handoff Express

### Objetivo:
Comprobar que el sistema genera el reporte resumido formateado para portapapeles con los datos exactos del triage tridimensional.

### Pasos:
1. En la tabla de la pestaña **Cartera**, hacer clic en el botón de la fila de una startup (icono de portapapeles 📋 o botón "Ficha Handoff").
2. Observar el toast de confirmación en pantalla: *"Ficha de Handoff Express copiada al portapapeles ✓"*.
3. Pegar el portapapeles en un editor de texto (Bloc de Notas, Slack o correo).
4. Validar que el texto pegado contiene la estructura oficial:
   * Nombre de la startup, arquetipo y KPIs clave (Runway, Trust Score).
   * Diagnóstico Tridimensional (Foco Principal, Bloqueadores, Ruta Asignada).
   * Acción Correctiva Inmediata propuesta.
   * Footer con marca temporal de auditoría.

### Resultado Esperado:
El formato es limpio, austero, legible y los valores coinciden exactamente con los de la fila correspondiente en la tabla.

---

## Caso de Prueba 3: Bloqueo de Financiación Pública por Deuda Fiscal

### Objetivo:
Confirmar la aplicación determinista de la regla de bloqueo si una startup posee deudas con administraciones públicas superiores a 3.000€.

### Pasos:
1. Preparar un libro diario contable (o modificar una sesión `.aptki`) de forma que el saldo neto acreedor de las cuentas del **Grupo 47** (Hacienda Pública y Seguridad Social) sume un importe de 3.500€.
2. Ingestar la sesión o diario en la Workstation.
3. Observar la fila de la startup en la tabla de la **Cartera**.
4. Verificar que:
   * El campo **Bloqueador** muestra: *"Regularización Deuda Pública"*.
   * La **Ruta Sugerida** cambia obligatoriamente a: *"Gestoría / Orden Contable"*.
   * La acción correctiva propuesta advierte de la contingencia con Hacienda/SS e indica regularizar el saldo antes de tramitar ayudas.

### Resultado Esperado:
El sistema bloquea la ruta "Financiación Pública" derivándola a Gestoría de forma inflexible, asegurando que no se tramiten solicitudes destinadas al rechazo administrativo.

---

## Caso de Prueba 4: Bloqueo por Relaciones con Socios (Cuenta 551/550 > 3.000€)

### Objetivo:
Validar que la regla de bloqueo de Due Diligence por préstamos de la sociedad a socios o aportaciones transitorias no reguladas superiores a 3.000€ netos en la cuenta 551/550 se activa correctamente.

### Pasos:
1. Configurar un libro contable o sesión con un saldo deudor neto final en la cuenta 551/550 superior a 3.000€ (ej: 5.000€), o bien un saldo acreedor neto final en la cuenta 551/550 superior a 3.000€ (ej: 5.000€).
2. Cargar el archivo en la Workstation.
3. Revisar el diagnóstico tridimensional en la tabla ejecutiva de Cartera.
4. Confirmar que:
   * El campo **Bloqueador** es: *"Saneamiento Socios (Due Diligence)"*.
   * La **Ruta Sugerida** se redirige a: *"Gestoría / Orden Contable"*.
   * En caso de saldo deudor, la acción propone el saneamiento de balance (devolución del préstamo).
   * En caso de saldo acreedor, la acción propone la formalización contractual de préstamo mercantil devengando intereses al tipo legal del 3,25%.

### Resultado Esperado:
La alerta se activa al superar el umbral material unificado de 3.000€ (tanto deudor como acreedor) sobre el saldo neto agregado de la cuenta 551/550, impidiendo el enrutamiento a Fundraising o Financiación Pública y derivando preventivamente a Gestoría.

---

## Caso de Prueba 5: Transición y Rehidratación Total de Sesión Individual

### Objetivo:
Asegurar que la transición desde la vista consolidada de Cartera al análisis profundo del Dashboard de una startup individual recupera todo el estado de forma intacta.

### Pasos:
1. En la tabla de **Cartera**, hacer clic en el botón de acción **"Analizar"** (icono de flecha ➜) sobre una de las startups cargadas.
2. Observar la transición visual rápida a la pestaña **Dashboard**.
3. Verificar que:
   * El badge del menú superior muestra el nombre de la startup y el perfil activo.
   * La sección de PyG, Gráficos, Previsiones de Forecaster y Scoring de Financiación se rehidratan con los datos contables específicos de esa compañía.
   * Las periodificaciones aplicadas y el estado del Checklist se restauran perfectamente.
4. Volver a la pestaña **Cartera** y comprobar que la lista consolidada de startups sigue disponible sin pérdida de información.

### Resultado Esperado:
Transición fluida sin pérdida de estado global ni colisiones de datos contables entre empresas.
