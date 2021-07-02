"use strict";

// Imports //
const express = require("express");
const es6Renderer = require("express-es6-template-engine");
const pgp = require("pg-promise")({});
const dbsettings = process.env.DATABASE_URL || { database: "kcalorie" };
const db = pgp(dbsettings);
const app = express();

// Rendering //
app.engine("html", es6Renderer);
app.set("views", "templates");
app.set("view engine", "html");
app.use("/public", express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const results = await db.query(`SELECT * FROM food_items`);
  res.render("homepage.html", { locals: { results } });
});

const PORT = process.env.PORT || 3785;

app.listen(PORT, () => {
  console.log(`listenin on port: ${PORT}`);
});
