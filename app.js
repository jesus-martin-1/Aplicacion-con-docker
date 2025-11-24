const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const Helmet = require('helmet');
const csurf = require('csurf');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(Helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const SESSION_SECRET = process.env.SESSION_SECRET || 'secret_dev_change_me';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

// Conexión MySQL con pool
let pool;
async function initPool() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'testuser',
    password: process.env.DB_PASSWORD || 'testpass',
    database: process.env.DB_NAME || 'testdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}
initPool().catch(err => { console.error('DB pool error', err); process.exit(1); });

// Middleware: comprobar sesión
function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

// Middleware: role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.session.role !== role) return res.status(403).json({ error: 'Acceso denegado' });
    next();
  };
}

// Registro
app.post('/api/register',
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    try {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO usuarios (username, password) VALUES (?, ?)', [username, hashed]);
      return res.json({ ok: true, message: 'Usuario registrado' });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: 'Usuario ya existe o error DB' });
    }
  }
);

// Login (sessión)
app.post('/api/login',
  body('username').exists(),
  body('password').exists(),
  async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
      if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

      // Guardar en sesión
      req.session.user = { id: user.id, username: user.username };
      req.session.role = user.role;

      // Opcional: generar JWT
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SESSION_SECRET, { expiresIn: '1h' });

      return res.json({ ok: true, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
);

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'No se pudo cerrar sesión' });
    res.json({ ok: true });
  });
});
//Dahsboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.status(403).send("Debes iniciar sesión");
  res.send(`Bienvenido ${req.session.user}, esta es tu área privada.`);
});

// Endpoint protegido (sesión)
app.get('/api/profile', ensureAuth, async (req, res) => {
  // devolver info básica
  res.json({ user: req.session.user, role: req.session.role });
});

// CRUD de usuarios (solo admin puede listar y eliminar)
app.get('/api/users', ensureAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, role, created_at FROM usuarios');
  res.json(rows);
});

app.delete('/api/users/:id', ensureAuth, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  res.json({ ok: true });
});

// Endpoint ejemplo: insertar mensaje asociado al usuario
app.post('/api/message', ensureAuth, body('text').isLength({ min: 1 }).trim().escape(), async (req, res) => {
  const { text } = req.body;
  // Para simplificar, guardamos en una tabla mensajes (crear si hace falta)
  await pool.query(`CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    texto VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query('INSERT INTO mensajes (user_id, texto) VALUES (?, ?)', [req.session.user.id, text]);
  res.json({ ok: true });
});

// Obtener mensajes del usuario
app.get('/api/messages', ensureAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, texto, created_at FROM mensajes WHERE user_id = ?', [req.session.user.id]);
  res.json(rows);
});

// Ruta catch-all: servir index
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
});
