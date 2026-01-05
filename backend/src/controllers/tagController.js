/**
 * Tag Controller
 * Gestisce la creazione, modifica, eliminazione e ricerca dei tag.
 * L’accesso ai dati è delegato al model Tag.
 */

const Tags = require("../models/Tag");

exports.list = async (req, res, next) => {
  try {
    const q = req.query.q;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const items = await Tags.list({ q, limit, offset });
    const total = await Tags.count({ q });

    res.json({ total, items });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const tag = await Tags.findById(Number(req.params.id));
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }
    res.json(tag);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const tag = await Tags.create({ name: name.trim() });
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const tag = await Tags.update(Number(req.params.id), { name: name.trim() });
    res.json(tag);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const out = await Tags.remove(Number(req.params.id));
    res.json(out);
  } catch (err) {
    next(err);
  }
};
