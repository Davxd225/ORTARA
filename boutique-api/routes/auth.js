const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  const requiredConfig = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "JWT_SECRET"];
  const missingConfig = requiredConfig.filter(
    (key) => !process.env[key] || !process.env[key].trim()
  );
  if (missingConfig.length > 0) {
    return res.status(503).json({
      message: `Connexion administrateur non configurée : ${missingConfig.join(", ")}.`,
    });
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const token = jwt.sign(
    { email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

module.exports = router;
