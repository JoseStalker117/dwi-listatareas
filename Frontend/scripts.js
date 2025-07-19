// === VARIABLES GLOBALES ===
let tasks = [];

// Función para obtener la URL base de la API
function getApiBaseUrl() {
  // return window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : "http://localhost:8800";
  return window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : "https://dwi-fastapi.onrender.com";
}

// === FUNCIONES PRINCIPALES DE API ===
async function fetchTasks() {
  try {
    const res = await window.authUtils.authenticatedFetch(
      `${getApiBaseUrl()}/actividades/`
    );
    if (res && res.ok) {
      let data = await res.json();
      // Asegurar que data sea un array
      tasks = Array.isArray(data) ? data : [];
      console.log("Tareas cargadas:", tasks.length);
      if (typeof renderTasks === "function") {
        renderTasks();
      }
    } else {
      console.error("Error en respuesta:", res ? res.status : "No response");
      tasks = []; // Asegurar que tasks sea un array vacío en caso de error
      if (typeof renderTasks === "function") {
        renderTasks();
      }
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    tasks = []; // Asegurar que tasks sea un array vacío en caso de error
    showNotification("Error al cargar las actividades", "error");
    if (typeof renderTasks === "function") {
      renderTasks();
    }
  }
}

async function createTask(task) {
  try {
    const res = await window.authUtils.authenticatedFetch(
      `${getApiBaseUrl()}/actividades/`,
      {
        method: "POST",
        body: JSON.stringify(task),
      }
    );
    if (res && res.ok) {
      // No llamar a fetchTasks aquí para evitar recursión
      // await fetchTasks();
      showNotification("Actividad creada exitosamente", "success");
      return true; // Indicar éxito
    } else {
      const error = await res.json();
      showNotification("Error al crear actividad: " + error.detail, "error");
      return false; // Indicar error
    }
  } catch (error) {
    console.error("Error creating task:", error);
    showNotification("Error al crear la actividad", "error");
    return false; // Indicar error
  }
}

async function updateTask(_id, task) {
  try {
    const res = await window.authUtils.authenticatedFetch(
      `${getApiBaseUrl()}/actividades/${_id}`,
      {
        method: "PUT",
        body: JSON.stringify(task),
      }
    );
    if (res && res.ok) {
      await fetchTasks();
      showNotification("Actividad actualizada exitosamente", "success");
    } else {
      const error = await res.json();
      showNotification(
        "Error al actualizar actividad: " + error.detail,
        "error"
      );
    }
  } catch (error) {
    console.error("Error updating task:", error);
    showNotification("Error al actualizar la actividad", "error");
  }
}

async function deleteTask(_id) {
  try {
    const res = await window.authUtils.authenticatedFetch(
      `${getApiBaseUrl()}/actividades/${_id}`,
      {
        method: "DELETE",
      }
    );
    if (res && res.ok) {
      await fetchTasks();
      showNotification("Actividad eliminada exitosamente", "success");
    } else {
      showNotification("Error al eliminar la actividad", "error");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    showNotification("Error al eliminar la actividad", "error");
  }
}

async function alternarEstadoActividad(actividadId) {
  try {
    const res = await window.authUtils.authenticatedFetch(
      `${getApiBaseUrl()}/actividades/${actividadId}/alternar_estado`,
      {
        method: "PATCH",
      }
    );
    if (res && res.ok) {
      await fetchTasks();
      showNotification("Estado de actividad cambiado", "success");
    } else {
      showNotification("Error al cambiar el estado", "error");
    }
  } catch (error) {
    console.error("Error toggling task status:", error);
    showNotification("Error al cambiar el estado", "error");
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = "info") {
  // Crear elemento de notificación
  const notification = document.createElement("div");
  notification.className = `alert alert-${
    type === "error" ? "danger" : type
  } alert-dismissible fade show position-fixed`;
  notification.style.top = "80px";
  notification.style.right = "20px";
  notification.style.zIndex = "9999";
  notification.style.minWidth = "300px";

  notification.innerHTML = `
    <i class="fas fa-${
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-triangle"
        : "info-circle"
    } me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(notification);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      const alert = new bootstrap.Alert(notification);
      alert.close();
    }
  }, 5000);
}

// Inicialización principal
document.addEventListener("DOMContentLoaded", function () {
  // La inicialización se maneja en auth-check.js
  // fetchTasks se llamará después de la autenticación
});

// Función para inicializar después de la autenticación
function initializeTasksApp() {
  // Verificar que tenemos autenticación antes de cargar tareas
  if (window.authUtils && window.authUtils.getAuthToken()) {
    fetchTasks();
  } else {
    console.log('Esperando autenticación...');
    // Reintentar después de un momento
    setTimeout(() => {
      if (window.authUtils && window.authUtils.getAuthToken()) {
        fetchTasks();
      }
    }, 1000);
  }
}

// Hacer las funciones globalmente disponibles para otros scripts
window.createTask = createTask;
window.fetchTasks = fetchTasks;
window.updateTask = updateTask;
window.deleteTask = deleteTask;
window.alternarEstadoActividad = alternarEstadoActividad;
window.showNotification = showNotification;
window.getApiBaseUrl = getApiBaseUrl;

console.log('✅ Funciones de scripts.js asignadas globalmente:', {
  createTask: typeof window.createTask,
  fetchTasks: typeof window.fetchTasks,
  updateTask: typeof window.updateTask,
  deleteTask: typeof window.deleteTask,
  alternarEstadoActividad: typeof window.alternarEstadoActividad,
  showNotification: typeof window.showNotification
});
