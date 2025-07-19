// Script de verificación para asegurar que todas las funciones estén disponibles
console.log('=== VERIFICACIÓN DE FUNCIONES ===');

// Verificar configuración
console.log('window.APP_CONFIG:', window.APP_CONFIG);

// Verificar funciones principales
const requiredFunctions = [
    'createTask',
    'fetchTasks', 
    'updateTask',
    'deleteTask',
    'alternarEstadoActividad',
    'showNotification'
];

requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`✅ ${funcName} está disponible`);
    } else {
        console.error(`❌ ${funcName} NO está disponible`);
    }
});

// Verificar autenticación
if (window.authUtils) {
    console.log('✅ authUtils está disponible');
    console.log('Token:', window.authUtils.getAuthToken() ? 'Presente' : 'No presente');
} else {
    console.error('❌ authUtils NO está disponible');
}

console.log('=== FIN VERIFICACIÓN ===');