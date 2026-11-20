const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");
const auth = require("../middleware/auth");
const Product = require("../models/Product");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "boutique",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const hasCloudinaryConfig = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
].every((key) => Boolean(process.env[key] && process.env[key].trim()));

const upload = hasCloudinaryConfig
  ? multer({ storage }).single("image")
  : multer().none();

async function setProductImage(product, req) {
  const body = req.body || {};
  if (!req.file && body.imageUrl === undefined) return;

  if (
    product.image &&
    product.image.publicId &&
    hasCloudinaryConfig
  ) {
    await cloudinary.uploader.destroy(product.image.publicId);
  }

  if (req.file) {
    product.image = { url: req.file.path, publicId: req.file.filename };
    return;
  }

  const imageUrl = String(body.imageUrl).trim();
  product.image = imageUrl ? { url: imageUrl } : undefined;
}

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    res.json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    next(error);
  }
});

router.post("/", auth, upload, async (req, res, next) => {
  try {
    const body = req.body || {};
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    if (!category) {
      return res.status(400).json({
        message: "Une catégorie est obligatoire pour ajouter un article.",
      });
    }

    const product = new Product({
      name: body.name,
      description: body.description,
      price: body.price,
      category,
      stock: body.stock,
    });
    await setProductImage(product, req);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", auth, upload, async (req, res, next) => {
  try {
    const body = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    if (body.name !== undefined) product.name = body.name;
    if (body.description !== undefined) product.description = body.description;
    if (body.price !== undefined) product.price = body.price;
    if (body.category !== undefined) product.category = body.category;
    if (body.stock !== undefined) product.stock = body.stock;

    await setProductImage(product, req);
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    next(error);
  }
});

router.delete("/categories", auth, async (req, res, next) => {
  try {
    const category =
      typeof req.body?.category === "string" ? req.body.category.trim() : "";
    if (!category) {
      return res.status(400).json({
        message: "Indiquez une catégorie à supprimer.",
      });
    }

    const result = await Product.updateMany(
      { category },
      { $set: { category: "" } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({
        message: "Cette catégorie ne contient plus d’article.",
      });
    }

    res.json({ category, updatedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    if (
      product.image &&
      product.image.publicId &&
      hasCloudinaryConfig
    ) {
      await cloudinary.uploader.destroy(product.image.publicId);
    }

    await product.deleteOne();
    res.json({ message: "Produit supprime" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    next(error);
  }
});

router.use((error, req, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  if (
    error.name === "MulterError" &&
    error.code === "LIMIT_UNEXPECTED_FILE" &&
    !hasCloudinaryConfig
  ) {
    return res.status(400).json({
      message:
        "L'envoi de fichier image n'est pas configuré. Envoyez une URL dans le champ imageUrl.",
    });
  }
  console.error(error);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

module.exports = router;
