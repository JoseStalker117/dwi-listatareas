// Configuración de la API (se carga desde config.js)
const API_BASE_URL = window.APP_CONFIG
  ? window.APP_CONFIG.API_BASE_URL
  : "https://dwi-fastapi.onrender.com";
//   : "http://localhost:8800";

// Utilidades para alertas
function showAlert(message, type = "info", duration = 5000) {
  const alertContainer = document.getElementById("alertContainer");
  const alertId = "alert-" + Date.now();

  const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

  alertContainer.innerHTML = alertHTML;

  // Auto-remover después del tiempo especificado
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      const alert = new bootstrap.Alert(alertElement);
      alert.close();
    }
  }, duration);
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  };
  return icons[type] || "info-circle";
}

// Utilidades para botones de loading
function setButtonLoading(buttonId, loading = true) {
  const button = document.getElementById(buttonId);
  if (loading) {
    button.disabled = true;
    button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Procesando...
        `;
  } else {
    button.disabled = false;
    // Restaurar texto original basado en el ID
    if (buttonId === "loginBtn") {
      button.innerHTML =
        '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
    } else if (buttonId === "registerBtn") {
      button.innerHTML = '<i class="fas fa-user-plus me-2"></i>Crear Cuenta';
    }
  }
}

// Validación de formularios
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function validateForm(formData, isRegister = false) {
  const errors = [];

  if (!validateEmail(formData.email)) {
    errors.push("El email no tiene un formato válido");
  }

  if (!validatePassword(formData.password)) {
    errors.push("La contraseña debe tener al menos 6 caracteres");
  }

  if (isRegister) {
    if (!formData.nombre || formData.nombre.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push("Las contraseñas no coinciden");
    }
  }

  return errors;
}

// Funciones de autenticación
async function handleLogin(formData) {
  try {
    const fullUrl = window.buildApiUrl
      ? window.buildApiUrl("/sesion/login")
      : `${API_BASE_URL}/sesion/login`;
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("URL completa:", fullUrl);
    console.log("Intentando login con:", fullUrl);
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    console.log(
      "Respuesta del servidor:",
      response.status,
      response.statusText
    );

    if (response.ok) {
      const data = await response.json();

      // Guardar datos de sesión
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          user_id: data.user_id,
          email: data.email,
        })
      );

      showAlert("¡Inicio de sesión exitoso! Redirigiendo...", "success", 2000);

      // Redirigir a la página principal después de 2 segundos
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        showAlert("Error de autenticación: " + error.detail, "danger");
      } else {
        const errorText = await response.text();
        console.error("Respuesta no JSON:", errorText);
        showAlert(
          "Error del servidor. Verifica que FastAPI esté ejecutándose en puerto 8800",
          "danger"
        );
      }
    }
  } catch (error) {
    console.error("Error completo:", error);
    showAlert(
      "Error de conexión: Verifica que FastAPI esté ejecutándose en http://localhost:8800",
      "danger"
    );
  }
}

async function handleRegister(formData) {
  try {
    const fullUrl = window.buildApiUrl
      ? window.buildApiUrl("/usuarios/")
      : `${API_BASE_URL}/usuarios/`;
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("URL completa:", fullUrl);
    console.log("Intentando registro con:", fullUrl);
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
      }),
    });

    console.log(
      "Respuesta del servidor:",
      response.status,
      response.statusText
    );

    if (response.ok) {
      showAlert(
        "¡Cuenta creada exitosamente! Redirigiendo al login...",
        "success",
        3000
      );

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } else {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        showAlert("Error al crear la cuenta: " + error.detail, "danger");
      } else {
        const errorText = await response.text();
        console.error("Respuesta no JSON:", errorText);
        showAlert(
          "Error del servidor. Verifica que FastAPI esté ejecutándose en puerto 8800",
          "danger"
        );
      }
    }
  } catch (error) {
    console.error("Error completo:", error);
    showAlert(
      "Error de conexión: Verifica que FastAPI esté ejecutándose en http://localhost:8800",
      "danger"
    );
  }
}

// Inicialización del formulario de login
function initializeLogin() {
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");

  // Toggle para mostrar/ocultar contraseña
  togglePassword.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const icon = this.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

  // Manejo del formulario de login
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
    };

    // Validar formulario
    const errors = validateForm(formData, false);
    if (errors.length > 0) {
      showAlert(errors.join("<br>"), "danger");
      return;
    }

    setButtonLoading("loginBtn", true);

    try {
      await handleLogin(formData);
    } finally {
      setButtonLoading("loginBtn", false);
    }
  });

  // Verificar si ya está logueado
  const token = localStorage.getItem("authToken");
  if (token) {
    // Verificar si el token es válido
    fetch(`${API_BASE_URL}/sesion/verify-token?token=${token}`)
      .then((response) => {
        if (response.ok) {
          window.location.href = "/";
        }
      })
      .catch(() => {
        // Token inválido, limpiar storage
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
      });
  }
}

// Inicialización del formulario de registro
function initializeRegister() {
  const registerForm = document.getElementById("registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );

  // Toggle para mostrar/ocultar contraseña
  togglePassword.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const icon = this.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

  // Toggle para confirmar contraseña
  toggleConfirmPassword.addEventListener("click", function () {
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const icon = this.querySelector("i");

    if (confirmPasswordInput.type === "password") {
      confirmPasswordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      confirmPasswordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

  // Validación en tiempo real de confirmación de contraseña
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  function validatePasswordMatch() {
    if (
      confirmPasswordInput.value &&
      passwordInput.value !== confirmPasswordInput.value
    ) {
      confirmPasswordInput.classList.add("is-invalid");
      confirmPasswordInput.classList.remove("is-valid");
    } else if (confirmPasswordInput.value) {
      confirmPasswordInput.classList.add("is-valid");
      confirmPasswordInput.classList.remove("is-invalid");
    }
  }

  passwordInput.addEventListener("input", validatePasswordMatch);
  confirmPasswordInput.addEventListener("input", validatePasswordMatch);

  // Manejo del formulario de registro
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById("nombre").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    // Validar formulario
    const errors = validateForm(formData, true);
    if (errors.length > 0) {
      showAlert(errors.join("<br>"), "danger");
      return;
    }

    setButtonLoading("registerBtn", true);

    try {
      await handleRegister(formData);
    } finally {
      setButtonLoading("registerBtn", false);
    }
  });

  // Verificar si ya está logueado
  const token = localStorage.getItem("authToken");
  if (token) {
    // Verificar si el token es válido
    fetch(`${API_BASE_URL}/sesion/verify-token?token=${token}`)
      .then((response) => {
        if (response.ok) {
          window.location.href = "/";
        }
      })
      .catch(() => {
        // Token inválido, limpiar storage
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
      });
  }
}
