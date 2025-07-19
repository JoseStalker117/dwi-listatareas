// Script de prueba para verificar carga de funciones
console.log('🧪 Test de carga iniciado...');

// Esperar un momento para que todo se cargue
setTimeout(() => {
    console.log('🔍 Verificando funciones después de carga...');
    
    const functions = ['createTask', 'fetchTasks', 'updateTask', 'deleteTask'];
    functions.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ ${func} cargada correctamente`);
        } else {
            console.error(`❌ ${func} NO cargada`);
        }
    });
    
    // Verificar configuración
    console.log('🔧 Configuración:', window.APP_CONFIG);
    console.log('🔑 Auth utils:', !!window.authUtils);
    
    // Test de URL
    if (typeof getApiBaseUrl === 'function') {
        console.log('🌐 URL API:', getApiBaseUrl());
    }
    
}, 2000);

console.log('🧪 Test de carga programado para 2 segundos...');