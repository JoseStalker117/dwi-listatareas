// === FORMULARIO DE CREACIÓN DE TAREAS (Panel Izquierdo) ===

// Elementos del formulario
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const descriptionInput = document.getElementById("descriptionInput");
const priorityInput = document.getElementById("priorityInput");
const finInput = document.getElementById("finInput");

// Elementos de contactos dinámicos
const contactosContainer = document.getElementById("contactosContainer");
const addContactoBtn = document.getElementById("addContactoBtn");
const contactoSubform = document.getElementById("contactoSubform");
const contactoClave = document.getElementById("contactoClave");
const contactoEmail = document.getElementById("contactoEmail");
const guardarContactoBtn = document.getElementById("guardarContactoBtn");
const cancelarContactoBtn = document.getElementById("cancelarContactoBtn");

let contactos = [];

// Funciones de contactos
function groupContacts(list) {
  const grouped = { to: [], cc: [], bcc: [] };
  list.forEach((c) => {
    if (c.to) grouped.to.push(c.to);
    if (c.cc) grouped.cc.push(c.cc);
    if (c.bcc) grouped.bcc.push(c.bcc);
  });
  return grouped;
}

function renderContactos() {
  contactosContainer.innerHTML = "";

  // Group contacts by type
  const grouped = { to: [], cc: [], bcc: [] };
  contactos.forEach((contacto, index) => {
    const tipo = Object.keys(contacto)[0];
    const email = contacto[tipo];
    if (grouped[tipo]) {
      grouped[tipo].push({ email, index });
    }
  });

  // Render groups in order: to, cc, bcc
  ["to", "cc", "bcc"].forEach((tipo) => {
    if (grouped[tipo].length > 0) {
      const groupDiv = document.createElement("div");
      groupDiv.className = `contact-group ${tipo}`;
      groupDiv.innerHTML = `<strong>${
        tipo === "to" ? "Para" : tipo.toUpperCase()
      }:</strong> `;

      grouped[tipo].forEach(({ email, index }) => {
        const contactSpan = document.createElement("span");
        contactSpan.className = "contact-tag";
        contactSpan.innerHTML = `${email} <button type='button' class='remove-contact' data-idx='${index}'>×</button>`;
        groupDiv.appendChild(contactSpan);
      });

      contactosContainer.appendChild(groupDiv);
    }
  });
}

// Event listeners para contactos
contactoEmail.required = false;

addContactoBtn.onclick = () => {
  contactoSubform.style.display = "flex";
  contactoClave.value = "to";
  contactoEmail.value = "";
  contactoEmail.required = true;
  contactoEmail.focus();
};

cancelarContactoBtn.onclick = () => {
  contactoSubform.style.display = "none";
  contactoEmail.required = false;
  contactoEmail.value = "";
};

guardarContactoBtn.onclick = () => {
  const clave = contactoClave.value;
  const email = contactoEmail.value.trim();
  if (!contactoEmail.checkValidity()) {
    contactoEmail.reportValidity();
    return;
  }
  const obj = {};
  obj[clave] = email;
  contactos.push(obj);
  renderContactos();
  contactoSubform.style.display = "none";
  contactoEmail.required = false;
  contactoEmail.value = "";
};

contactosContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-contact")) {
    const idx = parseInt(e.target.dataset.idx);
    contactos.splice(idx, 1);
    renderContactos();
  }
});

// Submit del formulario
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log('📝 Enviando formulario de tarea...');
  
  const Nombre = taskInput.value.trim();
  const Categoria = categoryInput.value.trim();
  const Descripcion = descriptionInput.value.trim();
  let Prioridad = priorityInput.value;
  Prioridad = Prioridad === "" ? null : parseInt(Prioridad, 10);
  const Fin = finInput.value;
  const Estatus = document.getElementById("estatusInput").value;

  if (!Nombre) {
    alert('El nombre de la tarea es requerido');
    return;
  }

  const taskData = {
    Nombre,
    Categoria,
    Descripcion,
    Prioridad,
    Fin,
    Estatus,
    mailto: contactos,
  };
  
  console.log('📋 Datos de la tarea:', taskData);
  
  try {
    // Verificar que createTask esté disponible
    if (typeof window.createTask === 'function') {
      console.log('✅ createTask está disponible, enviando...');
      await window.createTask(taskData);
      
      // Limpiar formulario solo si fue exitoso
      taskForm.reset();
      contactos = [];
      renderContactos();
      
      // No es necesario recargar tareas aquí porque createTask ya lo hace
      // if (typeof window.fetchTasks === 'function') {
      //   await window.fetchTasks();
      // }
      
      console.log('✅ Tarea creada exitosamente');
    } else {
      console.error('❌ createTask no está definida');
      console.log('Funciones disponibles en window:', Object.keys(window).filter(key => key.includes('Task')));
      alert('Error: No se pudo crear la tarea. Las funciones no están cargadas correctamente.');
    }
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    alert('Error al crear la tarea: ' + error.message);
  }
});

// Inicialización de fecha por defecto
document.addEventListener("DOMContentLoaded", function () {
  const finInput = document.getElementById("finInput");
  if (finInput) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = "00";
    const min = "00";
    finInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
});
