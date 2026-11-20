const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "store",
      immutable: true,
      unique: true,
    },
    whatsappPhone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 32,
      validate: {
        validator(value) {
          const digits = value.replace(/\D/g, "");
          return !value || (digits.length >= 8 && digits.length <= 15);
        },
        message: "Le numéro WhatsApp doit contenir entre 8 et 15 chiffres.",
      },
    },
    whatsappMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    instagram: { type: String, default: "", trim: true, maxlength: 250 },
    tiktok: { type: String, default: "", trim: true, maxlength: 250 },
    facebook: { type: String, default: "", trim: true, maxlength: 250 },
    address: { type: String, default: "", trim: true, maxlength: 240 },
    serviceHours: { type: String, default: "", trim: true, maxlength: 160 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
