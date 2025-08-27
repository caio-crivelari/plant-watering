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
app.post("/insertNewPlant", async (req, res) => {
  const {
    plantName,
    lastWatering,
    wateringFrequency,
    nextWatering,
    lastFertilization,
    fertilizationFrequency,
    nextFertilization,
  } = req.body;

  try {
    const query =
      "INSERT INTO plant_schema.tbl_plants (plant_name, last_watering, watering_frequency, next_watering, last_fertilization, fertilization_frequency, next_fertilization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;";

    const values = [
      plantName,
      lastWatering,
      wateringFrequency,
      nextWatering,
      lastFertilization,
      fertilizationFrequency,
      nextFertilization,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Não foi possível cadastrar a planta");
    res
      .status(500)
      .json({ success: false, message: "Erro ao cadastrar planta" });
  }
});

//GET
app.get("/getPlants", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, plant_name, last_watering, watering_frequency, next_watering, last_fertilization, fertilization_frequency, next_fertilization from plant_schema.tbl_plants ORDER BY plant_name"
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Não foi possível listar as plantas");
    res
      .status(500)
      .json({ success: false, message: "Erro ao listar as plantas" });
  }
});

//PUT - UPDATE
app.put("/plants/:id/water", async (req, res) => {
  const { id } = req.params;
  const { lastWatering, nextWatering } = req.body;

  try {
    const updateQuery = `UPDATE plant_schema.tbl_plants set last_watering = $1, next_watering = $2 WHERE id = $3 RETURNING *;`;

    const result = await pool.query(updateQuery, [
      lastWatering,
      nextWatering,
      id,
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao atualizar a rega!" });
  }
});

//SE O SERVIDOR CONSEGUIR RODAR, APARECE NO CONSOLE A MENSAGEM ABAIXO
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
