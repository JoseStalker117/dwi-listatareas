// Elementos de filtros y lista
const taskListContainer = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');
const nameFilter = document.getElementById('nameFilter');
const categoryFilter = document.getElementById('categoryFilter');
const dateOrder = document.getElementById('dateOrder');
const deadlineOrder = document.getElementById('deadlineOrder');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');
const priorityFilter = document.getElementById('priorityFilter');
const hideCompleted = document.getElementById('hideCompleted');

// Mapeo de colores por estatus
const STATUS_COLORS = {
  'En proceso':   { border: '#ffc107', badge: '#fffbe6', text: '#856404', bg: 'rgba(255, 193, 7, 0.08)', alt: '#795548' },
  'Enviado al cliente': { border: '#28a745', badge: '#e6ffed', text: '#155724', bg: 'rgba(40, 167, 69, 0.08)', alt: '#155724' },
  'En revision':  { border: '#fd7e14', badge: '#fff3e6', text: '#a35b00', bg: 'rgba(253, 126, 20, 0.08)', alt: '#b45309' },
  'Finalizado':   { border: '#007bff', badge: '#e6f0ff', text: '#004085', bg: 'rgba(0, 123, 255, 0.08)', alt: '#003366' },
  'Cerrado':      { border: '#6c757d', badge: '#f2f2f2', text: '#343a40', bg: 'rgba(108, 117, 125, 0.18)', alt: '#222' },
};

function getStatusColors(estatus) {
  if (!estatus) return STATUS_COLORS['En proceso'];
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const keys = Object.keys(STATUS_COLORS);
  const found = keys.find(k => normalize(k) === normalize(estatus));
  return STATUS_COLORS[found] || STATUS_COLORS['En proceso'];
}

function getDaysRemaining(task) {
  if (!task.Fin) return Infinity;
  const now = new Date();
  const fin = new Date(task.Fin);
  const diffMs = fin - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

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
  params.push(`subject=${encodeURIComponent(task.Categoria || 'Categoria')} | ${encodeURIComponent(task.Nombre || 'Actividad')}`);
  if (params.length) mailtoLink += `?${params.join('&')}`;
  return mailtoLink;
}

function renderTasks() {
  taskListContainer.innerHTML = '';
  const status = statusFilter.value;
  const name = (nameFilter?.value || '').trim().toLowerCase();
  const category = (categoryFilter?.value || '').trim().toLowerCase();
  const priority = priorityFilter && priorityFilter.value !== '' ? parseInt(priorityFilter.value, 10) : null;
  const order = (dateOrder?.value || 'priority_asc');
  const hideCompletedChecked = hideCompleted ? hideCompleted.checked : true;

  // Verificar que tasks sea un array válido
  if (!Array.isArray(tasks)) {
    console.error('tasks no es un array:', tasks);
    taskListContainer.innerHTML = `<div class="no-tasks-message"> <br>Error cargando actividades<br><span style='font-size:1.2em'>Verifica la conexión con la API 🔌</span></div>`;
    return;
  }

  if (tasks.length === 0) {
    taskListContainer.innerHTML = `<div class="no-tasks-message"> <br>Vaya! No hay actividades<br><span style='font-size:1.2em'>¿Estamos de descanso? 😎☕</span></div>`;
    return;
  }

  let filtered = tasks.filter(t => {
    const statusMatch = status === 'all' || (t.Estatus && t.Estatus === status);
    const nameMatch = !name || t.Nombre.toLowerCase().includes(name);
    const categoryMatch = !category || t.Categoria.toLowerCase().includes(category);
    const priorityMatch = priority === null || t.Prioridad === priority;
    const completed = t.Estatus && (t.Estatus.toLowerCase() === 'finalizado' || t.Estatus.toLowerCase() === 'cerrado');
    const completedMatch = !hideCompletedChecked || !completed;
    return statusMatch && nameMatch && categoryMatch && priorityMatch && completedMatch;
  });

  // Ordenamiento
  if (order === 'priority_desc') {
    filtered = filtered.sort((a, b) => (b.Prioridad ?? -Infinity) - (a.Prioridad ?? -Infinity));
  } else if (order === 'priority_asc') {
    filtered = filtered.sort((a, b) => (a.Prioridad ?? Infinity) - (b.Prioridad ?? Infinity));
  } else if (order === 'created_desc') {
    filtered = filtered.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
  } else if (order === 'created_asc') {
    filtered = filtered.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
  } else if (order === 'fin_asc') {
    filtered = filtered.sort((a, b) => new Date(a.Fin) - new Date(b.Fin));
  } else if (order === 'fin_desc') {
    filtered = filtered.sort((a, b) => new Date(b.Fin) - new Date(a.Fin));
  }

  if (filtered.length === 0) {
    taskListContainer.innerHTML = `<div class="no-tasks-message">No hay tareas que coincidan con los filtros.</div>`;
    return;
  }

  filtered.forEach((task) => {
    const colors = getStatusColors(task.Estatus);
    let priorityClass = '';
    if (task.Estatus && task.Estatus.toLowerCase() === 'cerrado') priorityClass = 'cerrado';

    const daysRemaining = getDaysRemaining(task);
    let daysClass = '';
    if (daysRemaining < 0) daysClass = 'urgent';
    else if (daysRemaining <= 2) daysClass = 'urgent';
    else if (daysRemaining <= 7) daysClass = 'warning';

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
    taskListContainer.appendChild(card);
  });
}

// Event listeners para acciones de tarjetas
taskListContainer.addEventListener('click', async (e) => {
  const btn = e.target;
  const div = btn.closest('.activity-card');
  if (!div) return;
  const _id = div.dataset._id;
  const task = tasks.find(t => t._id === _id);
  if (!task) return;

  if (btn.classList.contains('btn-complete')) {
    btn.disabled = true;
    try {
      const actividadActualizada = await alternarEstadoActividad(_id);
      task.Estatus = actividadActualizada.Estatus;
      btn.textContent = actividadActualizada.Estatus && actividadActualizada.Estatus.toLowerCase() === 'cerrado' ? '🔓 Reabrir' : '✅ Completar';
      await fetchTasks();
    } catch (error) {
      // alert('Error al alternar el estado: ' + error.message); // Removido el alertbox
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

// Event listeners para filtros
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
  dateOrder.value = 'priority_asc'; // Resetear a prioridad ascendente por defecto
  deadlineOrder.value = 'asc';
  priorityFilter.value = ''; // Limpiar prioridad
  hideCompleted.checked = true; // Mostrar completados por defecto
  renderTasks();
});

// Añadir listeners para los nuevos filtros
[priorityFilter, hideCompleted].forEach(el => {
  if (el) {
    el.addEventListener('change', renderTasks);
    el.addEventListener('input', renderTasks);
  }
});
// Por defecto: prioridad descendente y ocultar completados
window.addEventListener('DOMContentLoaded', () => {
  if (dateOrder) dateOrder.value = 'priority_asc';
  if (hideCompleted) hideCompleted.checked = true;
  renderTasks();
});