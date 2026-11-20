const express = require("express");

const auth = require("../middleware/auth");
const Promotion = require("../models/Promotion");

const router = express.Router();

router.get("/active", async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      active: true,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    }).sort({ expiresAt: 1 });
    res.json(promotions);
  } catch (error) {
    next(error);
  }
});

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const promotion = new Promotion(req.body || {});
    await promotion.save();
    res.status(201).json(promotion);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion introuvable." });
    }

    const fields = [
      "title",
      "discountType",
      "discountValue",
      "category",
      "startsAt",
      "expiresAt",
      "message",
      "active",
    ];
    fields.forEach((field) => {
      if (req.body?.[field] !== undefined) {
        promotion[field] = req.body[field];
      }
    });

    await promotion.save();
    res.json(promotion);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/active", async (req, res, next) => {
  try {
    if (typeof req.body?.active !== "boolean") {
      return res.status(400).json({
        message: "Le statut de la promotion doit être activé ou désactivé.",
      });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion introuvable." });
    }

    promotion.active = req.body.active;
    await promotion.save();
    res.json(promotion);
  } catch (error) {
    next(error);
  }
});

router.use((error, req, res, next) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Erreur interne du serveur." });
});

module.exports = router;
