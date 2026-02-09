import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API для выполнения SQL
app.post("/api/query", async (req, res) => {
  const { host, port, user, password, database, schema, sql } = req.body;

  try {
    const pool = new Pool({ host, port, user, password, database });

    // Схема
    await pool.query(`SET search_path TO ${schema}`);

    // Выполнение запроса
    const result = await pool.query(sql);

    res.json({
      rows: result.rows,
      fields: result.fields.map(f => f.name),
    });

    await pool.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
    //error(host, port, err, res);
  }
});

// Получить список баз данных
app.post("/api/databases", async (req, res) => {
  const { host, port, user, password } = req.body;

  try {
    // Подключаемся к "postgres" базе для получения списка всех баз
    const pool = new Pool({
      host,
      port,
      user,
      password,
      database: "postgres", // системная база для запроса списка
      application_name: "sql-runner",
      options: "-c lc_messages=en_US.UTF-8"
    });

    const result = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname;
    `);

    res.json(result.rows.map(row => row.datname));

    await pool.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
    //error(host, port, err, res);
  }
});

// Получить список схем для выбранной базы
app.post("/api/schemas", async (req, res) => {
  const { host, port, user, password, database } = req.body;

  try {
    const pool = new Pool({
      host,
      port,
      user,
      password,
      database, // выбранная база
      application_name: "sql-runner",
      options: "-c lc_messages=en_US.UTF-8"
    });

    const result = await pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name;
    `);

    res.json(result.rows.map(row => row.schema_name));

    await pool.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
    //error(host, port, err, res);
  }
});

function error(host, port, err, res) {
  // проверяем ошибки подключения
  let message = err.message;

  if (err.code === 'ECONNREFUSED') {
    message = `Cannot connect to PostgreSQL server at ${host}:${port}`;
  } else if (err.code === '28P01') {
    message = `Invalid username/password for PostgreSQL server`;
  } else if (err.code === '3D000') {
    message = `Database "${database}" does not exist`;
  }
  // можно добавить другие коды ошибок при необходимости

  res.status(500).json({ error: message });
}

// --- Раздача Angular фронта ---
// const angularDistPath = "C:/git/pgosling/frontend/dist/frontend/browser/";

// app.use(express.static(angularDistPath));

// // Все не-API запросы → Angular index.html
// app.get("*", (req, res) => {
//   res.sendFile(path.join(angularDistPath, "index.html"));
// });

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));