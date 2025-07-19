// Configuración centralizada de la aplicación
window.APP_CONFIG = {
    API_BASE_URL: 'http://localhost:8800',
    FRONTEND_BASE_URL: 'http://localhost:8000',
    
    // Configuración de desarrollo
    DEBUG: true,
    
    // Configuración de autenticación
    TOKEN_EXPIRY_MINUTES: 30,
    
    // Endpoints de la API
    ENDPOINTS: {
        LOGIN: '/sesion/login',
        VERIFY_TOKEN: '/sesion/verify-token',
        USERS: '/usuarios/',
        ACTIVITIES: '/actividades/',
        TOGGLE_STATUS: '/alternar_estado'
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