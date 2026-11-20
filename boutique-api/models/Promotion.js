const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator(value) {
          return (
            Number.isInteger(value) &&
            (this.discountType !== "percentage" || value <= 100)
          );
        },
        message:
          "La remise doit être un nombre entier et un pourcentage ne peut pas dépasser 100.",
      },
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startsAt || value > this.startsAt;
        },
        message: "La date d’expiration doit être après la date de début.",
      },
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

promotionSchema.index({ active: 1, startsAt: 1, expiresAt: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);
