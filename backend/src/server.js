const path = require("path");

// Caricamento .env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// Per abilitarmi appinsights  che non ho ricevuto richieste
const appInsights = require('applicationinsights');

appInsights.setup("process.env.APPLICATIONINSIGHTS_CONNECTION_STRING")
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true) 
    .start();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Import dei middleware
const requireUser = require("./middleware/requireUser");
const { authPrincipal } = require("./middleware/authPrincipal");
const errorHandler = require("./middleware/errorHandler");

// Import delle rotte
const attachmentRoutes = require("./routes/attachmentRoutes");
const noteRoutes = require("./routes/noteRoutes");
const noteTagRoutes = require("./routes/noteTagRoutes");
const taskRoutes = require("./routes/taskRoutes");
const tagRoutes = require("./routes/tagRoutes");
const shareRoutes = require("./routes/shareRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const noteHistoryRoutes = require("./routes/noteHistoryRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Inizializzo app express (che è quello che poi vedrò)
const app = express();
app.set("etag", false);

const allowedOrigin = process.env.CORS_ORIGINS;

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));


app.use(express.json());
app.use(morgan("dev"));

app.post("/api/auth/register", (req, res) => {
  const { userId, name, email } = req.body;
  
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  console.log(`Utente identificato: ${email}`);

  res.status(200).json({ success: true, userId });
});

app.use("/api", authPrincipal);
app.use("/api", requireUser);

// Rotte delle varie api
app.use("/api", attachmentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notes", noteHistoryRoutes);
app.use("/api/notes", noteTagRoutes);

app.use("/api/tasks", taskRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

// Rotte parzialmente pubbliche
app.use("/api/users", userRoutes);
app.use("/api", shareRoutes);
app.use("/api/ai", aiRoutes);

// Error handlex (per ultimo sempre sennò crasha -- non so perchè)
app.use(errorHandler);

// Avvio il server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Nimbus API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
