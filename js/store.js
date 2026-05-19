/**
 * store.js — Motor Reactivo de Estado Global (Vanilla JS)
 * Implementa el patrón Proxy de Estado (State Wrapping) y el patrón Pub/Sub (Observer).
 * Desacopla la lógica de datos de la capa visual de app.js.
 */

class ReactiveStore {
  constructor(initialState = {}) {
    this.events = {}; // Almacenará los suscriptores: { 'eventName': [callbacks] }
    
    // Callback interno que el Proxy llamará ante cualquier mutación del objeto
    const onMutate = (path, newValue, oldValue, targetObj, prop) => {
      // 1. Notifica el path completo (ej. 'ui.entries.currentPage')
      this.publish(path, newValue, oldValue, targetObj);
      
      // 2. Notifica las partes del path (ej. 'ui.entries', 'ui')
      const segments = path.split('.');
      while (segments.pop()) {
        if (segments.length > 0) {
          const parentPath = segments.join('.');
          this.publish(parentPath, newValue, oldValue, targetObj);
        }
      }
      
      // 3. También notifica la propiedad local individual por compatibilidad (ej. 'parsedLedger', 'currentPage')
      this.publish(prop, newValue, oldValue, targetObj);
      
      // 4. Notifica al wildcard '*' (útil para auditoría global o debuggers)
      this.publish('*', path, newValue, oldValue, targetObj);
    };

    // Construimos el Proxy Profundo (Deep Proxy)
    this.state = this._createDeepProxy(initialState, onMutate);
  }

  /**
   * Crea un ES6 Proxy recursivo para detectar mutaciones en objetos anidados.
   * La trampa 'set' actúa como barrera inmutable.
   */
  _createDeepProxy(target, callback, path = '') {
    const handler = {
      set: (obj, prop, value) => {
        const oldValue = obj[prop];
        const currentPath = path ? `${path}.${prop}` : prop;
        
        // Si el nuevo valor inyectado es un objeto o array, lo envolvemos recursivamente
        // Esto asegura que mutaciones profundas (ej: STATE.empresa.nombre = 'X') sigan siendo reactivas
        // Solo envolvemos objetos planos y arrays para no romper instancias nativas (ej. File, Date)
        const isMappable = value !== null && typeof value === 'object' && 
                           (Array.isArray(value) || value.constructor === Object);
        const newValue = isMappable 
          ? this._createDeepProxy(value, callback, currentPath) 
          : value;

        // Solo publicamos el evento si el valor realmente ha cambiado (evita bucles)
        if (oldValue !== newValue) {
          obj[prop] = newValue;
          callback(currentPath, newValue, oldValue, obj, prop);
        }
        
        return true; // Asignación exitosa
      },
      deleteProperty: (obj, prop) => {
        if (prop in obj) {
          const oldValue = obj[prop];
          const currentPath = path ? `${path}.${prop}` : prop;
          delete obj[prop];
          callback(currentPath, undefined, oldValue, obj, prop);
        }
        return true;
      }
    };

    // Recursividad inicial: envolvemos los objetos anidados presentes en el initialState
    for (let key in target) {
      const value = target[key];
      const isMappable = value !== null && typeof value === 'object' && 
                         (Array.isArray(value) || value.constructor === Object);
      if (isMappable) {
        target[key] = this._createDeepProxy(value, callback, key);
      }
    }

    return new Proxy(target, handler);
  }

  // ==========================================
  // Patrón Pub/Sub (Observer)
  // ==========================================

  /**
   * Suscribe un callback a mutaciones de una parte específica del estado.
   * @param {string} eventName - Propiedad del estado (ej. 'parsedLedger', 'empresa', o '*' para todo).
   * @param {function} callback - Función a ejecutar cuando ocurra el cambio.
   * @returns {function} Función para desuscribirse de forma limpia.
   */
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Retorna la función 'unsubscribe'
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  /**
   * Dispara un evento notificando a todos sus suscriptores registrados.
   */
  publish(eventName, ...args) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error en el suscriptor del evento "${eventName}":`, error);
        }
      });
    }
  }
}

// ==========================================
// Contrato de Datos Inicial (Data Contract)
// ==========================================
const initialDataContract = {
  parsedLedger: null,
  analysisResult: null,
  selectedProfile: null,
  customMapping: null,
  extraInputs: {},
  empresa: { nombre: '', sector: '', empleados: 0 },
  scoringInputs: {},
  scoringResult: null,
  forecastResult: null,
  forecastScenario: 'base',
  auditTrail: [],
  _pendingFile: null,
  contextChecklist: null,
  accrualsReviewed: false,
  accrualCandidates: [],
  approvedAccruals: [],
  defensaPlanChoqueChecked: [],
  defensaSimulacionInputs: null,
  cartera: [],
  carteraActiveStartup: null,
  carteraMode: false,
  
  // Nodo de UI reactivo para Data Grids
  ui: {
    // Filtros de anomalías generales / hallazgos
    anomalyFilter: 'all',              // 'all' | 'critical' | 'high' | 'medium' | 'low'
    expandedAnomalies: [],             // Array de IDs o índices de anomalías expandidas en Master-Detail
    
    // Configuración del Data Grid de apuntes / asientos
    entries: {
      currentPage: 1,
      pageSize: 50,
      sortColumn: 'fecha',             // 'fecha' | 'asiento' | 'cuenta' | 'descripcion' | 'debe' | 'haber'
      sortDirection: 'desc',           // 'asc' | 'desc'
      filterText: ''                   // Buscador de texto libre (por descripción o cuenta)
    }
  }
};

// ==========================================
// Exportación
// ==========================================
// Instanciamos el store global. En un entorno sin módulos (script tag directos), 
// 'appStore' y su proxy 'STATE' estarán disponibles en el objeto window global.
const appStore = new ReactiveStore(initialDataContract);
const STATE = appStore.state; 
