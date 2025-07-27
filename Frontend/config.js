// Configuración centralizada de la aplicación
window.APP_CONFIG = {
    API_BASE_URL: 'https://dwi-fastapi.onrender.com',
    // API_BASE_URL: 'http://localhost:8800',
    FRONTEND_BASE_URL: 'http://localhost:8000',
    
    // Configuración de desarrollo
    DEBUG: true,
    
    // Configuración de autenticación
    TOKEN_EXPIRY_MINUTES: 30,
    
    // Configuración de heartbeat
    HEARTBEAT_INTERVAL_MS: 5 * 60 * 1000, // 5 minutos en milisegundos
    
    // Endpoints de la API
    ENDPOINTS: {
        LOGIN: '/sesion/login',
        VERIFY_TOKEN: '/sesion/verify-token',
        USERS: '/usuarios/',
        ACTIVITIES: '/actividades/',
        TOGGLE_STATUS: '/alternar_estado',
        HEALTH: '/' // Endpoint para heartbeat
    }
};

// Función helper para construir URLs
window.buildApiUrl = function(endpoint) {
    const baseUrl = window.APP_CONFIG.API_BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const fullUrl = baseUrl + cleanEndpoint;
    
    if (window.APP_CONFIG.DEBUG) {
        console.log('Building URL:', { baseUrl, endpoint: cleanEndpoint, fullUrl });
    }
    
    return fullUrl;
};

console.log('Configuración cargada:', window.APP_CONFIG);

// Función simple de heartbeat - solo GET a la API base cada 5 minutos
window.startHeartbeat = function() {
    if (window.heartbeatInterval) {
        return; // Ya está activo
    }
    
    const performHeartbeat = () => {
        fetch(window.APP_CONFIG.API_BASE_URL);
    };
    
    // Ejecutar inmediatamente
    performHeartbeat();
    
    // Configurar intervalo de 5 minutos
    window.heartbeatInterval = setInterval(performHeartbeat, 5 * 60 * 1000);
};

// Función para detener el heartbeat
window.stopHeartbeat = function() {
    if (window.heartbeatInterval) {
        clearInterval(window.heartbeatInterval);
        window.heartbeatInterval = null;
    }
};