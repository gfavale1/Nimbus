/**
 * User Controller
 * Gestisce le operazioni CRUD sugli utenti e la ricerca per email.
 * L’accesso ai dati è delegato al model User e le notifiche al notifyService.
 */

const Users = require("../models/User");
const {
  notifyUserCreated,
  notifyUserUpdated,
  notifyUserDeleted
} = require("../services/notifyService");

// GET /api/users
exports.list = async (_req, res, next) => {
  try {
    const rows = await Users.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/me
exports.me = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        message: "Invalid authenticated user",
        debug: req.user,
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};


// GET /api/users/:id
exports.get = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/users
exports.create = async (req, res, next) => {
  try {
    const { email, display_name } = req.body;

    if (!email || !display_name) {
      return res
        .status(400)
        .json({ message: "email e display_name richiesti" });
    }

    const exists = await Users.findByEmail(email);
    if (exists) {
      return res.status(409).json({ message: "Email già registrata" });
    }

    const user = await Users.create({ email, display_name });

    await notifyUserCreated(user);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id
exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { display_name } = req.body;

    if (!display_name || !display_name.trim()) {
      return res.status(400).json({ message: "display_name richiesto" });
    }

    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await Users.update(id, { display_name });

    await notifyUserUpdated(updated);

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id
exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await notifyUserDeleted(user);
    await Users.remove(id);

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/email/:email
exports.getByEmail = async (req, res, next) => {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ message: "Email non valida" });
    }

    const user = await Users.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};
