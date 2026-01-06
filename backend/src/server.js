const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Caricamento .env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    console.log("Ricevuta richiesta registrazione per:", email);
    
    // const user = await User.findOneAndUpdate({ userId }, { name, email }, { upsert: true, new: true });
    
    res.status(200).json({ success: true, user: { userId, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Autenticazione
// In produzione: EasyAuth + requireUser
// In sviluppo: bypass EasyAuth (requireUser resta attivo)
// if (process.env.EASYAUTH_BYPASS_DEV !== "1") {
app.use("/api", authPrincipal);
//} else {
//  console.log("Modalità DEV: bypass EasyAuth attivo - senno non mi apparo con autent.");
// }

// Tutte le API sotto /api richiedono utente autenticato
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nimbus API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
