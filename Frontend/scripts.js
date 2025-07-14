const form = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const categoryInput = document.getElementById('categoryInput');
const descriptionInput = document.getElementById('descriptionInput');
const priorityInput = document.getElementById('priorityInput');
const finInput = document.getElementById('finInput');
const taskList = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');
const nameFilter = document.getElementById('nameFilter');
const categoryFilter = document.getElementById('categoryFilter');
const dateOrder = document.getElementById('dateOrder');
const deadlineOrder = document.getElementById('deadlineOrder');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');

let tasks = [];
let editingId = null;

async function fetchTasks() {
  const res = await fetch('http://localhost:8800/actividades');
  let data = await res.json();
  tasks = data; // Usar los datos tal cual
  renderTasks();
}

async function createTask(task) {
  const res = await fetch('http://localhost:8800/actividades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function updateTask(_id, task) {
  const res = await fetch(`http://localhost:8800/actividades/${_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function deleteTask(_id) {
  const res = await fetch(`http://localhost:8800/actividades/${_id}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function alternarEstadoActividad(actividadId) {
  try {
    const response = await fetch(`http://localhost:8800/actividades/${actividadId}/alternar_estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al alternar el estado');
    }

    const actividadActualizada = await response.json();
    return actividadActualizada;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Eliminar getTaskColor (no se usa)

// Mapeo de colores por estatus
const STATUS_COLORS = {
  'En proceso':   { border: '#ffc107', badge: '#fffbe6', text: '#856404', bg: 'rgba(255, 193, 7, 0.08)', alt: '#795548' }, // marrón oscuro
  'Enviado al cliente': { border: '#28a745', badge: '#e6ffed', text: '#155724', bg: 'rgba(40, 167, 69, 0.08)', alt: '#155724' }, // verde oscuro
  'En revision':  { border: '#fd7e14', badge: '#fff3e6', text: '#a35b00', bg: 'rgba(253, 126, 20, 0.08)', alt: '#b45309' }, // naranja oscuro
  'Finalizado':   { border: '#007bff', badge: '#e6f0ff', text: '#004085', bg: 'rgba(0, 123, 255, 0.08)', alt: '#003366' }, // azul oscuro
  'Cerrado':      { border: '#6c757d', badge: '#f2f2f2', text: '#343a40', bg: 'rgba(108, 117, 125, 0.18)', alt: '#222' }, // negro
};

function getStatusColors(estatus) {
  // Robustecer: quitar tildes y comparar en minúsculas
  if (!estatus) return STATUS_COLORS['En proceso'];
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const keys = Object.keys(STATUS_COLORS);
  const found = keys.find(k => normalize(k) === normalize(estatus));
  return STATUS_COLORS[found] || STATUS_COLORS['En proceso'];
}

function renderTasks() {
  taskList.innerHTML = '';
  const status = statusFilter.value;
  const name = (nameFilter?.value || '').trim().toLowerCase();
  const category = (categoryFilter?.value || '').trim().toLowerCase();
  const order = (dateOrder?.value || 'desc');
  const deadlineOrderValue = (deadlineOrder?.value || 'asc');

  // Si no hay ninguna tarea en la colección
  if (tasks.length === 0) {
    taskList.innerHTML = `<div class="no-tasks-message"> <br>Vaya! No hay actividades<br><span style='font-size:1.2em'>¿Estamos de descanso? 😎☕</span></div>`;
    return;
  }

  let filtered = tasks.filter(t => {
    const status = statusFilter.value;
    const statusMatch = status === 'all' || (t.Estatus && t.Estatus === status);
    const nameMatch = !name || t.Nombre.toLowerCase().includes(name);
    const categoryMatch = !category || t.Categoria.toLowerCase().includes(category);
    return statusMatch && nameMatch && categoryMatch;
  });

  function getDaysRemaining(task) {
    if (!task.Fin) return Infinity;
    const now = new Date();
    const fin = new Date(task.Fin);
    const diffMs = fin - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (deadlineOrderValue && deadlineOrderValue !== 'none') {
    filtered = filtered.sort((a, b) => {
      const daysA = getDaysRemaining(a);
      const daysB = getDaysRemaining(b);
      return deadlineOrderValue === 'asc' ? daysA - daysB : daysB - daysA;
    });
  } else {
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.Fecha);
      const dateB = new Date(b.Fecha);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  if (filtered.length === 0) {
    taskList.innerHTML = `<div class="no-tasks-message">No hay tareas que coincidan con los filtros.</div>`;
    return;
  }

  filtered.forEach((task) => {
    // Colores según estatus
    const colors = getStatusColors(task.Estatus);
    // Determinar prioridad visual
    let priorityClass = '';
    if (task.Estatus && task.Estatus.toLowerCase() === 'cerrado') priorityClass = 'cerrado';

    // Días restantes
    const daysRemaining = getDaysRemaining(task);
    let daysClass = '';
    if (daysRemaining < 0) daysClass = 'urgent';
    else if (daysRemaining <= 2) daysClass = 'urgent';
    else if (daysRemaining <= 7) daysClass = 'warning';

    // Contactos y mailto agrupados
    let contactosHtml = '';
    let mailtoBtnHtml = '';
    if (Array.isArray(task.mailto) && task.mailto.length > 0) {
      const grouped = groupContacts(task.mailto);
      contactosHtml = ['to','cc','bcc'].map(tipo => {
        if (!grouped[tipo].length) return '';
        return `<div class="contact-group ${tipo}"><strong>${tipo === 'to' ? 'Para' : tipo.toUpperCase()}:</strong> ` +
          grouped[tipo].map(email => `<span class='contact-tag'>${email}</span>`).join(' ') + '</div>';
      }).join('');
      mailtoBtnHtml = `<a class="btn btn-mailto" href="${buildMailto(task)}" target="_blank">✉️ Mailto</a>`;
    }

    // Tarjeta
    const card = document.createElement('div');
    card.className = `activity-card ${priorityClass}`;
    card.dataset._id = task._id;
    card.style.borderLeft = `8px solid ${colors.border}`;
    card.innerHTML = `
      <div class="activity-card-bg" style="background:${colors.bg};"></div>
      <div class="main-content${priorityClass === 'cerrado' ? ' cerrado-text' : ''}">
        <div class="card-header-flex">
          <div class="card-header-left">
            <span class="category-badge" style="background:#fff;color:${colors.alt};border:1.5px solid ${colors.alt}">${task.Categoria || ''}</span>
            <span class="activity-title">${task.Nombre}</span>
          </div>
          <div class="priority-indicator" style="background:transparent;">
            <span class="priority-number" style="background:${colors.alt};color:#fff;">${task.Prioridad !== undefined && task.Prioridad !== null && task.Prioridad !== '' ? task.Prioridad : '-'}</span>
          </div>
        </div>
        <p class="activity-description">${task.Descripcion || ''}</p>
        ${contactosHtml}
      </div>
      <div class="dates-section">
        <div class="detail-item">
          <span class="detail-label">Fecha de creación</span>
          <span class="detail-value">${task.Fecha ? new Date(task.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha límite</span>
          <span class="detail-value">${task.Fin ? new Date(task.Fin).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}
        </div>
      </div>
      <div class="status-section">
        <div class="days-remaining ${daysClass}">
          ⏰ ${daysRemaining < 0 ? 'Vencida' : daysRemaining + ' días restantes'}
        </div>
        <div style="margin-top:10px;"><strong>Estatus:</strong> ${task.Estatus}</div>
      </div>
      <div class="actions-section">
        <button class="btn btn-complete">${task.Estatus && task.Estatus.toLowerCase() === 'cerrado' ? '🔓 Reabrir' : '✅ Completar'}</button>
        <button class="btn btn-edit">✏️ Editar</button>
        <button class="btn btn-delete">🗑️ Eliminar</button>
        ${mailtoBtnHtml}
      </div>
    `;
    taskList.appendChild(card);
  });
}

taskList.addEventListener('click', async (e) => {
  const btn = e.target;
  const div = btn.closest('.activity-card');
  if (!div) return;
  const _id = div.dataset._id;
  const task = tasks.find(t => t._id === _id);
  if (!task) return;

  if (btn.classList.contains('btn-complete')) {
    btn.disabled = true;
    try {
      // Llama a alternarEstadoActividad solo con el ID
      const actividadActualizada = await alternarEstadoActividad(_id);
      // Actualiza el objeto local y la UI
      task.Estatus = actividadActualizada.Estatus;
      // Actualiza el texto del botón según el nuevo estado
      btn.textContent = actividadActualizada.Estatus && actividadActualizada.Estatus.toLowerCase() === 'cerrado' ? '🔓 Reabrir' : '✅ Completar';
      // Opcional: refresca la lista para reflejar otros posibles cambios
      await fetchTasks();
    } catch (error) {
      alert('Error al alternar el estado: ' + error.message);
    } finally {
      btn.disabled = false;
    }
  } else if (btn.classList.contains('btn-edit')) {
    openEditModal(task);
  } else if (btn.classList.contains('btn-delete')) {
    if (confirm('¿Eliminar esta tarea?')) {
      await deleteTask(_id);
    }
  }
});

// --- Contactos dinámicos para creación ---
const contactosContainer = document.getElementById('contactosContainer');
const addContactoBtn = document.getElementById('addContactoBtn');
const contactoSubform = document.getElementById('contactoSubform');
const contactoClave = document.getElementById('contactoClave');
const contactoEmail = document.getElementById('contactoEmail');
const guardarContactoBtn = document.getElementById('guardarContactoBtn');
const cancelarContactoBtn = document.getElementById('cancelarContactoBtn');

let contactos = [];

function groupContacts(list) {
  const grouped = { to: [], cc: [], bcc: [] };
  list.forEach(c => {
    if (c.to) grouped.to.push(c.to);
    if (c.cc) grouped.cc.push(c.cc);
    if (c.bcc) grouped.bcc.push(c.bcc);
  });
  return grouped;
}

function renderContactos() {
  contactosContainer.innerHTML = '';
  const grouped = groupContacts(contactos);
  ['to', 'cc', 'bcc'].forEach(tipo => {
    if (grouped[tipo].length) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'contact-group';
      groupDiv.innerHTML = `<strong>${tipo === 'to' ? 'Para' : tipo.toUpperCase()}:</strong> ` +
        grouped[tipo].map((email, idx) => {
          const i = contactos.findIndex(c => c[tipo] === email);
          return `<span class='contact-tag'><strong>${clave.toUpperCase()}:</strong> ${valor}</span>`;
        }).join(' ');
      contactosContainer.appendChild(groupDiv);
    }
  });
}

// Al cargar la página, el campo no es requerido
contactoEmail.required = false;

addContactoBtn.onclick = () => {
  contactoSubform.style.display = 'flex';
  contactoClave.value = 'to';
  contactoEmail.value = '';
  contactoEmail.required = true; // Solo requerido cuando visible
  contactoEmail.focus();
};

cancelarContactoBtn.onclick = () => {
  contactoSubform.style.display = 'none';
  contactoEmail.required = false; // No requerido cuando oculto
  contactoEmail.value = '';
};

guardarContactoBtn.onclick = () => {
  const clave = contactoClave.value;
  const email = contactoEmail.value.trim();
  // Validación HTML5 se encarga del email y required
  if (!contactoEmail.checkValidity()) {
    contactoEmail.reportValidity();
    return;
  }
  const obj = {};
  obj[clave] = email;
  contactos.push(obj);
  renderContactos();
  contactoSubform.style.display = 'none';
  contactoEmail.required = false; // No requerido cuando oculto
  contactoEmail.value = '';
};

contactosContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-contact')) {
    const idx = parseInt(e.target.dataset.idx);
    contactos.splice(idx, 1);
    renderContactos();
  }
});

// --- Contactos dinámicos para edición ---
const editContactosContainer = document.getElementById('editContactosContainer');
const addEditContactoBtn = document.getElementById('addEditContactoBtn');
let editContactos = [];

// Subformulario para agregar contacto en el modal de edición
let editContactoSubform = null;
let editContactoClave = null;
let editContactoEmail = null;
let guardarEditContactoBtn = null;
let cancelarEditContactoBtn = null;

function createEditContactoSubform() {
  if (editContactoSubform) return editContactoSubform;
  editContactoSubform = document.createElement('div');
  editContactoSubform.className = 'edit-contact-subform';
  editContactoSubform.style.display = 'flex';
  editContactoSubform.style.gap = '8px';
  editContactoSubform.style.margin = '10px 0';
  editContactoSubform.style.alignItems = 'center';
  editContactoSubform.innerHTML = `
    <select class="edit-contact-clave">
      <option value="to">To</option>
      <option value="cc">Cc</option>
      <option value="bcc">Bcc</option>
    </select>
    <input type="email" class="edit-contact-email" placeholder="correo@dominio.com" />
    <button type="button" class="guardar-edit-contacto">✅ Agregar</button>
    <button type="button" class="cancelar-edit-contacto">⛔ Cancelar</button>
  `;
  editContactoClave = editContactoSubform.querySelector('.edit-contact-clave');
  editContactoEmail = editContactoSubform.querySelector('.edit-contact-email');
  guardarEditContactoBtn = editContactoSubform.querySelector('.guardar-edit-contacto');
  cancelarEditContactoBtn = editContactoSubform.querySelector('.cancelar-edit-contacto');

  guardarEditContactoBtn.onclick = () => {
    const clave = editContactoClave.value;
    const email = editContactoEmail.value.trim();
    if (!editContactoEmail.checkValidity()) {
      editContactoEmail.reportValidity();
      return;
    }
    const obj = {};
    obj[clave] = email;
    editContactos.push(obj);
    renderEditContactos();
    editContactoSubform.style.display = 'none';
    editContactoEmail.value = '';
  };
  cancelarEditContactoBtn.onclick = () => {
    editContactoSubform.style.display = 'none';
    editContactoEmail.value = '';
  };
  return editContactoSubform;
}

function renderEditContactos() {
  editContactosContainer.innerHTML = '';
  const grouped = groupContacts(editContactos);
  ['to', 'cc', 'bcc'].forEach(tipo => {
    if (grouped[tipo].length) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'contact-group ' + tipo;
      groupDiv.innerHTML = `<strong>${tipo === 'to' ? 'Para' : tipo.toUpperCase()}:</strong> ` +
        grouped[tipo].map((email, idx) => {
          // Encuentra el índice real en editContactos
          const i = editContactos.findIndex(c => c[tipo] === email);
          return `<span class='contact-tag'>${email} <button type='button' class='remove-contact' data-idx='${i}'>×</button></span>`;
        }).join(' ');
      editContactosContainer.appendChild(groupDiv);
    }
  });
}

addEditContactoBtn.onclick = () => {
  const subform = createEditContactoSubform();
  subform.style.display = 'flex';
  editContactosContainer.parentNode.insertBefore(subform, editContactosContainer);
  editContactoClave.value = 'to';
  editContactoEmail.value = '';
  editContactoEmail.required = false;
  editContactoEmail.focus();
};

editContactosContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-contact')) {
    const idx = parseInt(e.target.dataset.idx);
    editContactos.splice(idx, 1);
    renderEditContactos();
  }
});

// --- Adaptar submit de creación ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const Nombre = taskInput.value.trim();
  const Categoria = categoryInput.value.trim();
  const Descripcion = descriptionInput.value.trim();
  let Prioridad = priorityInput.value;
  Prioridad = Prioridad === '' ? null : parseInt(Prioridad, 10);
  const Fin = finInput.value;
  const Estatus = document.getElementById('estatusInput').value;
  if (Nombre) {
    const taskData = { Nombre, Categoria, Descripcion, Prioridad, Fin, Estatus, mailto: contactos };
    if (editingId) {
      await updateTask(editingId, taskData);
      editingId = null;
    } else {
      await createTask(taskData);
    }
    form.reset();
    contactos = [];
    renderContactos();
    await fetchTasks();
  }
});

applyFilters.addEventListener('click', renderTasks);

[nameFilter, categoryFilter, statusFilter, dateOrder, deadlineOrder].forEach(el => {
  if (el) {
    el.addEventListener('change', renderTasks);
    el.addEventListener('input', renderTasks);
  }
});

clearFilters.addEventListener('click', () => {
  statusFilter.value = 'all';
  nameFilter.value = '';
  categoryFilter.value = '';
  dateOrder.value = 'desc';
  deadlineOrder.value = 'asc';
  renderTasks();
});

// Modal de edición
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeEditModalBtn = document.getElementById('closeEditModal');

// --- Adaptar modal de edición ---
function openEditModal(task) {
  document.getElementById('editId').value = task._id;
  document.getElementById('editNombre').value = task.Nombre;
  document.getElementById('editCategoria').value = task.Categoria;
  document.getElementById('editDescripcion').value = task.Descripcion;
  document.getElementById('editPrioridad').value = (task.Prioridad !== undefined && task.Prioridad !== null) ? task.Prioridad : '';
  document.getElementById('editFin').value = task.Fin ? task.Fin.slice(0, 16) : '';
  // Estatus por default 'en proceso'
  document.getElementById('editEstatus').value = task.Estatus || 'en proceso';
  editContactos = Array.isArray(task.mailto) ? [...task.mailto] : [];
  renderEditContactos();
  editModal.style.display = 'flex';
}

closeEditModalBtn.onclick = () => {
  editModal.style.display = 'none';
};

editForm.onsubmit = async (e) => {
  e.preventDefault();
  const _id = document.getElementById('editId').value;
  const Nombre = document.getElementById('editNombre').value.trim();
  const Categoria = document.getElementById('editCategoria').value.trim();
  const Descripcion = document.getElementById('editDescripcion').value.trim();
  let Prioridad = document.getElementById('editPrioridad').value;
  Prioridad = Prioridad === '' ? null : parseInt(Prioridad, 10);
  const Fin = document.getElementById('editFin').value;
  const Estatus = document.getElementById('editEstatus').value;
  if (Nombre) {
    await updateTask(_id, { Nombre, Categoria, Descripcion, Prioridad, Fin, Estatus, mailto: editContactos });
    editModal.style.display = 'none';
  }
};

// Solo cerrar con Escape, no con click en el fondo
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && editModal.style.display === 'flex') {
    editModal.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const finInput = document.getElementById('finInput');
  if (finInput) {
    const now = new Date();
    now.setHours(0,0,0,0);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = '00';
    const min = '00';
    finInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
  fetchTasks();
});

// Extraer función utilitaria para mailto
function buildMailto(task) {
  let to = [], cc = [], bcc = [];
  (task.mailto || []).forEach(c => {
    if (c.to) to.push(c.to);
    if (c.cc) cc.push(c.cc);
    if (c.bcc) bcc.push(c.bcc);
  });
  let mailtoLink = `mailto:${encodeURIComponent(to.join(','))}`;
  let params = [];
  if (cc.length) params.push(`cc=${encodeURIComponent(cc.join(','))}`);
  if (bcc.length) params.push(`bcc=${encodeURIComponent(bcc.join(','))}`);
  params.push(`subject=${encodeURIComponent(task.Nombre || 'Actividad')}`);
  if (params.length) mailtoLink += `?${params.join('&')}`;
  return mailtoLink;
}