const api = "http://localhost:3000";

// ====================
// ELEMENTOS
// ====================
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const usuarioLogueado = document.getElementById("usuario-logueado");

const formLogin = document.getElementById("form-login");
const loginCedula = document.getElementById("login-cedula");
const loginClave = document.getElementById("login-clave");

const panelUsuarios = document.getElementById("panel-usuarios");
const panelMaterias = document.getElementById("panel-materias");
const panelEstudiantes = document.getElementById("panel-estudiantes");
const panelNotas = document.getElementById("panel-notas");

// Formularios
const formUsuario = document.getElementById("form-usuario");
const formMateria = document.getElementById("form-materia");
const formEstudiante = document.getElementById("form-estudiante");
const formNotas = document.getElementById("form-notas");

// Tablas
const tablaUsuariosBody = document.getElementById("tabla-usuarios-body");
const tablaMateriasBody = document.getElementById("tabla-materias-body");
const tablaEstudiantesBody = document.getElementById("tabla-estudiantes-body");
const tablaNotasBody = document.getElementById("tabla-notas-body");

// Selects de notas
const notaEstudiante = document.getElementById("nota-estudiante");
const notaMateria = document.getElementById("nota-materia");

// ====================
// LOGIN
// ====================
let usuarioActual = null;

formLogin.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const res = await fetch(`${api}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: loginCedula.value,
        clave: loginClave.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);

    usuarioActual = data.usuario;
    usuarioLogueado.textContent = usuarioActual.nombre;

    loginSection.classList.add("oculto");
    dashboardSection.classList.remove("oculto");

    // Resetear permisos: mostrar todos los botones
    document.querySelectorAll("form button[type='submit']").forEach(btn => btn.style.display = "inline-block");

    // Cargar datos
    cargarUsuarios();
    cargarMaterias();
    cargarEstudiantes();
    cargarNotas();

    // Si no es admin: ocultar botones de acción
    if (usuarioActual.rol !== "admin") {
      document.querySelectorAll("form button[type='submit']").forEach(btn => btn.style.display = "none");
      document.querySelectorAll("tbody button").forEach(btn => btn.remove());
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
});

// ====================
// FUNCIONES
// ====================
function mostrarPanel(panel) {
  panelUsuarios.classList.add("oculto");
  panelMaterias.classList.add("oculto");
  panelEstudiantes.classList.add("oculto");
  panelNotas.classList.add("oculto");

  switch(panel) {
    case "usuarios": panelUsuarios.classList.remove("oculto"); break;
    case "materias": panelMaterias.classList.remove("oculto"); break;
    case "estudiantes": panelEstudiantes.classList.remove("oculto"); break;
    case "notas": panelNotas.classList.remove("oculto"); break;
  }
}

// ====================
// CARGA DE DATOS
// ====================
async function cargarUsuarios() {
  const res = await fetch(`${api}/usuarios`);
  const usuarios = await res.json();
  tablaUsuariosBody.innerHTML = "";
  usuarios.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.cedula}</td>
      <td>${u.nombre}</td>
      <td>${u.rol}</td>
      <td>${usuarioActual.rol === "admin" ? `<button onclick="eliminarUsuario(${u.id})" class="btn btn-sm btn-danger">Eliminar</button>` : ""}</td>
    `;
    tablaUsuariosBody.appendChild(tr);
  });
}

async function cargarMaterias() {
  const res = await fetch(`${api}/materias`);
  const materias = await res.json();
  tablaMateriasBody.innerHTML = "";
  materias.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.codigo}</td>
      <td>${m.nombre}</td>
      <td>${usuarioActual.rol === "admin" ? `<button onclick="eliminarMateria(${m.id})" class="btn btn-sm btn-danger">Eliminar</button>` : ""}</td>
    `;
    tablaMateriasBody.appendChild(tr);
  });

  // Notas
  notaMateria.innerHTML = materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("");
}

async function cargarEstudiantes() {
  const res = await fetch(`${api}/estudiantes`);
  const estudiantes = await res.json();
  tablaEstudiantesBody.innerHTML = "";
  estudiantes.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.cedula}</td>
      <td>${e.nombre}</td>
      <td>${usuarioActual.rol === "admin" ? `<button onclick="eliminarEstudiante(${e.id})" class="btn btn-sm btn-danger">Eliminar</button>` : ""}</td>
    `;
    tablaEstudiantesBody.appendChild(tr);
  });

  // Notas
  notaEstudiante.innerHTML = estudiantes.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
}

async function cargarNotas() {
  const res = await fetch(`${api}/notas`);
  const notas = await res.json();
  tablaNotasBody.innerHTML = "";
  notas.forEach(n => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${n.estudiante}</td>
      <td>${n.materia}</td>
      <td>${n.valor}</td>
      <td>${usuarioActual.rol === "admin" ? `<button onclick="eliminarNota(${n.id})" class="btn btn-sm btn-danger">Eliminar</button>` : ""}</td>
    `;
    tablaNotasBody.appendChild(tr);
  });
}

// ====================
// CRUD ELIMINAR
// ====================
window.eliminarUsuario = async id => { if (!confirm("Eliminar usuario?")) return; await fetch(`${api}/usuarios/${id}`, { method: "DELETE" }); cargarUsuarios(); };
window.eliminarMateria = async id => { if (!confirm("Eliminar materia?")) return; await fetch(`${api}/materias/${id}`, { method: "DELETE" }); cargarMaterias(); };
window.eliminarEstudiante = async id => { if (!confirm("Eliminar estudiante?")) return; await fetch(`${api}/estudiantes/${id}`, { method: "DELETE" }); cargarEstudiantes(); };
window.eliminarNota = async id => { if (!confirm("Eliminar nota?")) return; await fetch(`${api}/notas/${id}`, { method: "DELETE" }); cargarNotas(); };

// ====================
// FORMULARIOS
// ====================
formUsuario.addEventListener("submit", async e => {
  e.preventDefault();
  await fetch(`${api}/usuarios`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    cedula: document.getElementById("user-cedula").value,
    nombre: document.getElementById("user-nombre").value,
    clave: document.getElementById("user-clave").value
  }) });
  formUsuario.reset(); cargarUsuarios();
});

formMateria.addEventListener("submit", async e => {
  e.preventDefault();
  await fetch(`${api}/materias`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    codigo: document.getElementById("materia-codigo").value,
    nombre: document.getElementById("materia-nombre").value
  }) });
  formMateria.reset(); cargarMaterias();
});

formEstudiante.addEventListener("submit", async e => {
  e.preventDefault();
  await fetch(`${api}/estudiantes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    cedula: document.getElementById("est-cedula").value,
    nombre: document.getElementById("est-nombre").value
  }) });
  formEstudiante.reset(); cargarEstudiantes();
});

formNotas.addEventListener("submit", async e => {
  e.preventDefault();
  await fetch(`${api}/notas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    estudiante_id: notaEstudiante.value,
    materia_id: notaMateria.value,
    valor: document.getElementById("nota-valor").value
  }) });
  formNotas.reset(); cargarNotas();
});

// ====================
// MENÚ
// ====================
document.getElementById("btn-usuarios").addEventListener("click", () => mostrarPanel("usuarios"));
document.getElementById("btn-materias").addEventListener("click", () => mostrarPanel("materias"));
document.getElementById("btn-estudiantes").addEventListener("click", () => mostrarPanel("estudiantes"));
document.getElementById("btn-notas").addEventListener("click", () => mostrarPanel("notas"));

// ====================
// LOGOUT
// ====================
document.getElementById("btn-logout").addEventListener("click", () => {
  usuarioActual = null;
  dashboardSection.classList.add("oculto");
  loginSection.classList.remove("oculto");
});
