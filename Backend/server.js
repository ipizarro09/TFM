const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: 'ipizarro',
  host: 'localhost',
  database: 'vizquest', 
  password: 'ipizarro', 
  port: 5432,
  options: '-c client_encoding=UTF8' // Asegura que se use UTF-8
});

// API para manejar el formulario
app.post('/submit-form', async (req, res) => {
  const { tipo_datos,n_dimensiones,proposito,contexto,dataset_size,ordenadas,n_grupos_alto,relacion,obs_grupo } = req.body;


  try {

    const { tipo_datos, n_dimensiones, proposito, contexto } = req.body;

    // Insertarmos las respuestas en la base de datos
    const result = await pool.query(
      `INSERT INTO respuestas (n_dimensiones,tipo_datos,ordenadas,n_grupos_alto,relacion,obs_grupo,proposito,dataset_size,contexto)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id` ,
      [n_dimensiones,tipo_datos,ordenadas,n_grupos_alto,relacion,obs_grupo,proposito,dataset_size,contexto]
    );

    const id = result.rows[0].id; // ID recién creado

    // Llamamos al recomendador Python
    const pythonProcess = spawn('python', ['./recomendador/recomendador.py', id]);

    let pythonOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error en el script Python: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        const recommendedGraph = pythonOutput.trim();

        // Actualizo la base de datos con la recomendación del gráfico así lo uso como dataset sintetico para IA
        await pool.query(
          `UPDATE respuestas SET grafico_recomendado = $1 WHERE id = $2`,
          [recommendedGraph, id]
        );

        res.json({ recommendation: pythonOutput.trim() }); // Enviamos la recomendación al cliente
      } else {
        res.status(500).send('Error al ejecutar el recomendador.');
      }
    });
  } catch (error) {
    console.error('Error al manejar el formulario:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
