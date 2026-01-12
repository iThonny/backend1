// src/api.js
const API_URL = "https://backend1-1-uulk.onrender.com"; // Tu backend Render

export async function login(cedula, clave) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cedula, clave }),
  });
  return res.json();
}

export async function getUsuarios() {
  const res = await fetch(`${API_URL}/usuarios`);
  return res.json();
}

export async function getMaterias() {
  const res = await fetch(`${API_URL}/materias`);
  return res.json();
}

export async function getEstudiantes() {
  const res = await fetch(`${API_URL}/estudiantes`);
  return res.json();
}

export async function getNotas() {
  const res = await fetch(`${API_URL}/notas`);
  return res.json();
}
