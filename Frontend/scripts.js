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
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');

let tasks = [];
let editingId = null;

async function fetchTasks() {
  const res = await fetch('https://dwi-fastapi.onrender.com/actividades');
  tasks = await res.json();
  renderTasks();
}

async function createTask(task) {
  const res = await fetch('https://dwi-fastapi.onrender.com/actividades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function updateTask(_id, task) {
  const res = await fetch(`https://dwi-fastapi.onrender.com/actividades/${_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function deleteTask(_id) {
  const res = await fetch(`https://dwi-fastapi.onrender.com/actividades/${_id}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    await fetchTasks();
  }
}

async function alternarEstadoActividad(actividadId) {
  try {
    const response = await fetch(`https://dwi-fastapi.onrender.com/actividades/${actividadId}/alternar_estado`, {
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

function getTaskColor(task) {
  const now = new Date();
  const fin = new Date(task.Fin);
  const diffMs = fin - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    return 'task-red'; // Vencida
  } else if (diffDays <= 7) {
    return 'task-yellow'; // Menos de una semana
  } else {
    return 'task-green'; // Próximas
  }
}

function renderTasks() {
  taskList.innerHTML = '';
  const status = statusFilter.value;
  const name = (nameFilter?.value || '').trim().toLowerCase();
  const category = (categoryFilter?.value || '').trim().toLowerCase();
  const order = (dateOrder?.value || 'desc');

  let filtered = tasks.filter(t => {
    const statusMatch = status === 'all' ||
      (status === 'pending' && !t.Estatus) ||
      (status === 'completed' && t.Estatus);
    const nameMatch = !name || t.Nombre.toLowerCase().includes(name);
    const categoryMatch = !category || t.Categoria.toLowerCase().includes(category);
    return statusMatch && nameMatch && categoryMatch;
  });

  filtered = filtered.sort((a, b) => {
    const dateA = new Date(a.Fecha);
    const dateB = new Date(b.Fecha);
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (filtered.length === 0) {
    taskList.innerHTML = '<p>No hay tareas que coincidan con los filtros.</p>';
    return;
  }

  filtered.forEach((task) => {
    const div = document.createElement('div');
    div.className = `task ${getTaskColor(task)}${task.Estatus ? ' completed' : ''}`;
    div.dataset._id = task._id;
    div.innerHTML = `
      <div class="task-header${task.Estatus ? ' completed' : ''}">
        <span class="title">
           <strong>${task.Categoria ? `[${task.Categoria}]` : ''}</strong> ${task.Nombre}
        </span>
        <div class="task-buttons">
          <button class="complete-btn">${task.Estatus ? 'Marcar Pendiente' : 'Completar'}</button>
          <button class="edit-btn">Editar</button>
          <button class="delete-btn">Eliminar</button>
        </div>
      </div>
      ${task.Descripcion ? `<p><strong>Descripción:</strong> ${task.Descripcion}</p>` : ''}
      <div class="task-dates">
        <small><strong>Creada:</strong> ${task.Fecha ? new Date(task.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}</small><br/>
        <small><strong>Fin:</strong> ${task.Fin ? new Date(task.Fin).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}</small>
      </div>
      <div class="task-priority">
        <small><strong>Prioridad:</strong> ${task.Prioridad}</small>
      </div>
    `;
    taskList.appendChild(div);
  });
}

taskList.addEventListener('click', async (e) => {
  const btn = e.target;
  const div = btn.closest('.task');
  if (!div) return;
  const _id = div.dataset._id;
  const task = tasks.find(t => t._id === _id);
  if (!task) return;

  if (btn.classList.contains('complete-btn')) {
    // Prevenir múltiples clicks
    btn.disabled = true;
    
    try {
      // Usar la nueva función para alternar el estado
      const actividadActualizada = await alternarEstadoActividad(_id);
      
      // Actualizar el estado local
      task.Estatus = actividadActualizada.Estatus;
      
      // Actualizar visualmente
      div.classList.toggle('completed', actividadActualizada.Estatus);
      div.querySelector('.task-header').classList.toggle('completed', actividadActualizada.Estatus);
      
      // Actualizar el texto del botón
      const buttonText = actividadActualizada.Estatus ? 'Marcar Pendiente' : 'Completar';
      btn.textContent = buttonText;
      
      console.log('Estado alternado exitosamente:', actividadActualizada);
      
    } catch (error) {
      // Si hay error, mostrar mensaje
      alert('Error al alternar el estado: ' + error.message);
      console.error('Error al alternar estado:', error);
    } finally {
      // Rehabilitar el botón
      btn.disabled = false;
    }
  } else if (btn.classList.contains('edit-btn')) {
    openEditModal(task);
  } else if (btn.classList.contains('delete-btn')) {
    if (confirm('¿Eliminar esta tarea?')) {
      await deleteTask(_id);
    }
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const Nombre = taskInput.value.trim();
  const Categoria = categoryInput.value.trim();
  const Descripcion = descriptionInput.value.trim();
  const Prioridad = priorityInput.value.trim();
  const Fin = finInput.value;
  if (Nombre) {
    const taskData = { Nombre, Categoria, Descripcion, Prioridad, Fin };
    if (editingId) {
      await updateTask(editingId, taskData);
      editingId = null;
    } else {
      await createTask(taskData);
    }
    form.reset();
    await fetchTasks();
  }
});

applyFilters.addEventListener('click', renderTasks);

[nameFilter, categoryFilter, statusFilter, dateOrder].forEach(el => {
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
  renderTasks();
});

// Modal de edición
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeEditModalBtn = document.getElementById('closeEditModal');

function openEditModal(task) {
  document.getElementById('editId').value = task._id;
  document.getElementById('editNombre').value = task.Nombre;
  document.getElementById('editCategoria').value = task.Categoria;
  document.getElementById('editDescripcion').value = task.Descripcion;
  document.getElementById('editPrioridad').value = task.Prioridad;
  document.getElementById('editFin').value = task.Fin ? task.Fin.slice(0, 16) : '';
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
  const Prioridad = document.getElementById('editPrioridad').value.trim();
  const Fin = document.getElementById('editFin').value;
  if (Nombre) {
    await updateTask(_id, { Nombre, Categoria, Descripcion, Prioridad, Fin });
    editModal.style.display = 'none';
  }
};

window.onclick = function(event) {
  if (event.target === editModal) {
    editModal.style.display = 'none';
  }
};

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