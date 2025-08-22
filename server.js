// server.js
const express = require("express");
const pool = require("./db/connection");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

/*ROTINA DE TESTE DE CONEXÃO COM O BANCO DE DADOS: USE O http://localhost:3000/test-db */
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro na conexão com o banco",
      error: error.message,
    });
  }
});

//POST

/* app.post('/insertNewPlant', async (req, res) => {
  const { 
    plantName,
    wateringFrequency,
    lastWatering,
    lastFertilization,
    fertilizationFrequency
  } = req.body

  try {
    const query = "INSERT INTO plant_schema.tbl_plants"
  } catch (error) {
    
  }
}) */

//SE O SERVIDOR CONSEGUIR RODAR, APARECE NO CONSOLE A MENSAGEM ABAIXO
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
