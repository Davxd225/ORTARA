const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Le prix doit être un nombre entier en FCFA.",
      },
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Le stock doit être un nombre entier.",
      },
    },
    image: {
      url: {
        type: String,
        trim: true,
        validate: {
          validator(value) {
            if (!value) return true;
            try {
              const url = new URL(value);
              return url.protocol === "http:" || url.protocol === "https:";
            } catch (error) {
              return false;
            }
          },
          message: "L'image doit avoir une URL HTTP ou HTTPS valide.",
        },
      },
      publicId: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
