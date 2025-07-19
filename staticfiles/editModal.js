// Elementos del modal
const editModalElement = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeEditModalBtn = document.getElementById('closeEditModal');

// Elementos de contactos para edición
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
          const i = editContactos.findIndex(c => c[tipo] === email);
          return `<span class='contact-tag'>${email} <button type='button' class='remove-contact' data-idx='${i}'>×</button></span>`;
        }).join(' ');
      editContactosContainer.appendChild(groupDiv);
    }
  });
}

function openEditModal(task) {
  document.getElementById('editId').value = task._id;
  document.getElementById('editNombre').value = task.Nombre;
  document.getElementById('editCategoria').value = task.Categoria;
  document.getElementById('editDescripcion').value = task.Descripcion;
  document.getElementById('editPrioridad').value = (task.Prioridad !== undefined && task.Prioridad !== null) ? task.Prioridad : '';
  document.getElementById('editFin').value = task.Fin ? task.Fin.slice(0, 16) : '';
  document.getElementById('editEstatus').value = task.Estatus || 'en proceso';
  editContactos = Array.isArray(task.mailto) ? [...task.mailto] : [];
  renderEditContactos();
  editModalElement.style.display = 'flex';
}

// Event listeners del modal
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

closeEditModalBtn.onclick = () => {
  editModalElement.style.display = 'none';
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
    editModalElement.style.display = 'none';
  }
};

// Cerrar modal con Escape
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && editModalElement.style.display === 'flex') {
    editModalElement.style.display = 'none';
  }
});