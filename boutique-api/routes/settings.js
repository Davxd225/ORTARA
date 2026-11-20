const express = require("express");

const auth = require("../middleware/auth");
const StoreSettings = require("../models/StoreSettings");

const router = express.Router();
const settingsKey = "store";
const editableFields = [
  "whatsappPhone",
  "whatsappMessage",
  "instagram",
  "tiktok",
  "facebook",
  "address",
  "serviceHours",
];

function serializeSettings(settings) {
  if (!settings) return {};
  const result = settings.toObject({ versionKey: false });
  delete result._id;
  delete result.key;
  return result;
}

router.get("/public", async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne({ key: settingsKey });
    res.json(serializeSettings(settings));
  } catch (error) {
    next(error);
  }
});

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne({ key: settingsKey });
    res.json(serializeSettings(settings));
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const values = {};

    for (const field of editableFields) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== "string") {
        return res.status(400).json({
          message: `Le champ ${field} doit être du texte.`,
        });
      }
      values[field] = body[field];
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: settingsKey },
      {
        $set: values,
        $setOnInsert: { key: settingsKey },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
    res.json(serializeSettings(settings));
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
