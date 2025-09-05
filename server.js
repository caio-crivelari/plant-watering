// server.js
const express = require("express");
const pool = require("./db/connection");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path"); // ✅ faltava importar

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

// Caminhos para suas credenciais
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

// Escopos necessários para o Calendar
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// Lê o credentials.json
function loadCredentials() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  return JSON.parse(content);
}

// Lê o token.json (se existir)
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("Token não encontrado! Gere o token.json primeiro.");
  }
  const content = fs.readFileSync(TOKEN_PATH, "utf-8");
  return JSON.parse(content);
}

function getAuthClient() {
  const { client_secret, client_id, redirect_uris } = loadCredentials().web; // 👈 direto em "web"

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = loadToken();
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

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
app.post("/createCalendarEvent", async (req, res) => {
  const { plantName, date } = req.body;

  try {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    // Transformando a data recebida (dd/mm/aaaa) para incluir 14:00
    const [day, month, year] = date.split("/"); 
    const eventDate = new Date(year, month - 1, day, 14, 0); // hora 14:00

    const event = {
      summary: `Regar ${plantName}`,
      description: "Lembrete automático do app de plantas 🌱",
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: new Date(eventDate.getTime() + 30 * 60 * 1000).toISOString(), // duração 30 min
        timeZone: "America/Sao_Paulo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 10 },
          { method: "email", minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json({
      success: true,
      message: "Evento criado com sucesso",
      link: response.data.htmlLink,
    });
  } catch (error) {
    console.error("Erro ao criar evento no Calendar:", error);
    res.status(500).json({ success: false, message: "Erro ao criar evento" });
  }
});

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

// Rota para iniciar o fluxo OAuth2
app.get("/auth", (req, res) => {
  const { client_id, redirect_uris } = loadCredentials().web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    loadCredentials().web.client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  res.redirect(authUrl);
});

// Callback do Google OAuth2
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const { client_id, client_secret, redirect_uris } = loadCredentials().web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // salva o token.json no disco
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    res.send("✅ Autorização concluída! Token salvo em token.json");
  } catch (err) {
    console.error("Erro ao obter o token:", err);
    res.status(500).send("Erro ao autenticar com o Google");
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

app.put("/plants/:id/fertilize", async (req, res) => {
  const { id } = req.params;
  const { lastFertilization, nextFertilization } = req.body;

  try {
    const updateQuery = `UPDATE plant_schema.tbl_plants set last_fertilization = $1, next_fertilization = $2 WHERE id = $3 RETURNING *;`;

    const result = await pool.query(updateQuery, [
      lastFertilization,
      nextFertilization,
      id,
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao atualizar a adubagem!" });
  }
});

//DELETE
app.delete("/plants/:id/delete", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM plant_schema.tbl_plants WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Planta não encontrada" });
    }
    res.json({ success: true, message: "Planta excluída com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao excluir planta" });
  }
});

//SE O SERVIDOR CONSEGUIR RODAR, APARECE NO CONSOLE A MENSAGEM ABAIXO
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
