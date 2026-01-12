import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Cargar variables de entorno

const { Pool } = pkg;

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "*" // Permite tu frontend Netlify
}));
app.use(express.json());

// ======================
// CONEXIÓN POSTGRESQL (Supabase)
// ======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URL de Supabase desde Render
  ssl: { rejectUnauthorized: false } // obligatorio para Supabase
});

// ======================
// CREAR TABLAS
// ======================
async function crearTablas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'usuario'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS materias (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) NOT NULL,
        nombre VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id SERIAL PRIMARY KEY,
        cedula VARCHAR(20) NOT NULL,
        nombre VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id SERIAL PRIMARY KEY,
        estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
        materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
        valor NUMERIC(5,2) NOT NULL
      );
    `);

    console.log("✅ Tablas verificadas/creadas correctamente");
  } catch (err) {
    console.error("Error creando tablas:", err);
  }
}
crearTablas();

// ======================
// ADMIN POR DEFECTO
// ======================
async function crearAdminPorDefecto() {
  try {
    const cedula = "123456789";
    const nombre = "Andres";
    const clave = "1234";

    const check = await pool.query(
      "SELECT * FROM usuarios WHERE cedula=$1",
      [cedula]
    );

    if (check.rows.length === 0) {
      const hash = await bcrypt.hash(clave, 10);
      await pool.query(
        "INSERT INTO usuarios (cedula,nombre,clave) VALUES ($1,$2,$3)",
        [cedula, nombre, hash]
      );
      console.log("✅ Admin creado");
    }
  } catch (error) {
    console.error("❌ Error creando admin:", error.message);
  }
}

crearAdminPorDefecto();

// ======================
// LOGIN
// ======================
app.post("/login", async (req, res) => {
  try {
    const { cedula, clave } = req.body;
    if (!cedula || !clave) return res.status(400).json({ msg: "Datos incompletos" });

    const result = await pool.query("SELECT * FROM usuarios WHERE cedula=$1", [cedula]);
    if (result.rows.length === 0) return res.status(401).json({ msg: "Usuario no existe" });

    const usuario = result.rows[0];
    const ok = await bcrypt.compare(clave, usuario.password);
    if (!ok) return res.status(401).json({ msg: "Clave incorrecta" });

    res.json({
      msg: "Login correcto",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        cedula: usuario.cedula,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// ======================
// CRUD USUARIOS
// ======================
app.post("/usuarios", async (req, res) => {
  try {
    const { cedula, nombre, clave } = req.body;
    if (!cedula || !nombre || !clave) return res.status(400).json({ msg: "Datos incompletos" });

    const hash = await bcrypt.hash(clave, 10);
    await pool.query(
      "INSERT INTO usuarios (cedula, nombre, password, rol) VALUES ($1,$2,$3,'usuario')",
      [cedula, nombre, hash]
    );
    res.json({ msg: "Usuario creado correctamente" });
  } catch (error) {
    if (error.code === "23505") return res.status(400).json({ msg: "La cédula ya existe" });
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

app.get("/usuarios", async (_req, res) => {
  const result = await pool.query("SELECT id, cedula, nombre, rol FROM usuarios ORDER BY id");
  res.json(result.rows);
});

app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM usuarios WHERE id=$1", [id]);
  res.json({ msg: "Usuario eliminado" });
});

// ======================
// CRUD MATERIAS
// ======================
app.post("/materias", async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ msg: "Datos incompletos" });

    await pool.query("INSERT INTO materias (codigo, nombre) VALUES ($1,$2)", [codigo, nombre]);
    res.json({ msg: "Materia creada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

app.get("/materias", async (_req, res) => {
  const result = await pool.query("SELECT * FROM materias ORDER BY id");
  res.json(result.rows);
});

app.delete("/materias/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM materias WHERE id=$1", [id]);
  res.json({ msg: "Materia eliminada" });
});

// ======================
// CRUD ESTUDIANTES
// ======================
app.post("/estudiantes", async (req, res) => {
  try {
    const { cedula, nombre } = req.body;
    if (!cedula || !nombre) return res.status(400).json({ msg: "Datos incompletos" });

    await pool.query("INSERT INTO estudiantes (cedula, nombre) VALUES ($1,$2)", [cedula, nombre]);
    res.json({ msg: "Estudiante creado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

app.get("/estudiantes", async (_req, res) => {
  const result = await pool.query("SELECT * FROM estudiantes ORDER BY id");
  res.json(result.rows);
});

app.delete("/estudiantes/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM estudiantes WHERE id=$1", [id]);
  res.json({ msg: "Estudiante eliminado" });
});

// ======================
// CRUD NOTAS
// ======================
app.post("/notas", async (req, res) => {
  try {
    const { estudiante_id, materia_id, valor } = req.body;
    if (!estudiante_id || !materia_id || valor == null)
      return res.status(400).json({ msg: "Datos incompletos" });

    await pool.query(
      "INSERT INTO notas (estudiante_id, materia_id, valor) VALUES ($1,$2,$3)",
      [estudiante_id, materia_id, valor]
    );
    res.json({ msg: "Nota creada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

app.get("/notas", async (_req, res) => {
  const result = await pool.query(`
    SELECT n.id, e.nombre as estudiante, m.nombre as materia, n.valor
    FROM notas n
    JOIN estudiantes e ON n.estudiante_id = e.id
    JOIN materias m ON n.materia_id = m.id
    ORDER BY n.id
  `);
  res.json(result.rows);
});

app.delete("/notas/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM notas WHERE id=$1", [id]);
  res.json({ msg: "Nota eliminada" });
});

// ======================
// SERVIDOR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend activo en http://localhost:${PORT}`);
});
