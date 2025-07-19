// Script de diagnóstico para verificar configuración
console.log('=== DIAGNÓSTICO DE CONFIGURACIÓN ===');

// Verificar configuración
console.log('window.APP_CONFIG:', window.APP_CONFIG);
console.log('window.buildApiUrl:', typeof window.buildApiUrl);

// Probar construcción de URLs
if (window.buildApiUrl) {
    console.log('URL Login:', window.buildApiUrl('/sesion/login'));
    console.log('URL Register:', window.buildApiUrl('/usuarios/'));
    console.log('URL Activities:', window.buildApiUrl('/actividades/'));
} else {
    console.error('window.buildApiUrl no está disponible');
}

// Verificar conectividad básica
async function testConnection() {
    const baseUrl = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'http://localhost:8800';
    console.log('Probando conexión a:', baseUrl);
    
    try {
        const response = await fetch(baseUrl + '/');
        console.log('Respuesta del servidor:', response.status, response.statusText);
        if (response.ok) {
            const data = await response.json();
            console.log('Datos del servidor:', data);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

// Ejecutar test después de un momento
setTimeout(testConnection, 1000);

console.log('=== FIN DIAGNÓSTICO ===');