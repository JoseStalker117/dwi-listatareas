// Función para obtener la URL base de la API
function getApiBaseUrl() {
//   return window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'http://localhost:8800';
  return window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'https://dwi-fastapi.onrender.com';
  
}

// Variables globales de autenticación
let currentUser = null;
let authToken = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupLogout();
});

async function checkAuthentication() {
    // Obtener token del localStorage
    authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!authToken || !savedUser) {
        redirectToLogin();
        return;
    }
    
    try {
        // Verificar si el token es válido
        const response = await fetch(`${getApiBaseUrl()}/sesion/verify-token?token=${authToken}`);
        
        if (response.ok) {
            const data = await response.json();
            currentUser = JSON.parse(savedUser);
            
            // Mostrar información del usuario
            document.getElementById('userEmail').textContent = currentUser.email;
            
            // Inicializar la aplicación
            initializeApp();
        } else {
            // Token inválido
            clearAuthData();
            redirectToLogin();
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        clearAuthData();
        redirectToLogin();
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    // Detener heartbeat
    if (typeof window.stopHeartbeat === 'function') {
        window.stopHeartbeat();
    }
    
    clearAuthData();
    redirectToLogin();
}

function clearAuthData() {
    // Detener heartbeat
    if (typeof window.stopHeartbeat === 'function') {
        window.stopHeartbeat();
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
}

function redirectToLogin() {
    window.location.href = '/login';
}

// Función para hacer peticiones autenticadas a la API
async function authenticatedFetch(url, options = {}) {
    if (!authToken) {
        throw new Error('No hay token de autenticación');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const finalOptions = { ...options, headers: defaultOptions.headers };
    
    try {
        const response = await fetch(url, finalOptions);
        
        // Si el token ha expirado, redirigir al login
        if (response.status === 401) {
            clearAuthData();
            redirectToLogin();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        throw error;
    }
}

// Función para inicializar la aplicación después de la autenticación
function initializeApp() {
    console.log('Usuario autenticado:', currentUser);
    
    // Iniciar heartbeat
    if (typeof window.startHeartbeat === 'function') {
        window.startHeartbeat();
    }
    
    // Inicializar la aplicación de tareas
    if (typeof initializeTasksApp === 'function') {
        initializeTasksApp();
    }
}

// Exportar funciones para uso en otros scripts
window.authUtils = {
    authenticatedFetch,
    getCurrentUser: () => currentUser,
    getAuthToken: () => authToken,
    logout: handleLogout
};