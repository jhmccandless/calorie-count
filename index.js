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

let foodInfo;

app.get("/dashboard", async (req, res) => {
  const results = await db.query(`SELECT * FROM food_items`);
  console.log(results);
  res.render("homepage", { locals: { results } });
});

app.post("/food_input", (req, res) => {
  foodInfo = req.body;
  console.log(foodInfo);
  //   db.none(
  //     `INSERT INTO kcalorie (name, address, category) VALUES ('${foodInfo.food}', '${foodInfo.calories}', '${foodInfo.meal}', '${foodInfo.date}', '${foodInfo.time}')`
  //   );
  res.redirect(`/food_input/confirmation`);
});

app.get("/food_input", (req, res) => {
  res.render("add-food");
});

app.get("/food_input/confirmation", (req, res) => {
  // render ability to get the info from the table to compare, ability to choose which one with a checkbox?
  res.render("confirm-food", { locals: { foodInfo } });
});

app.post("/food_input/confirmation", (req, res) => {
  // need a submit button,
  res.redirect(`/dashboard`);
});

const PORT = process.env.PORT || 3785;

app.listen(PORT, () => {
  console.log(`listenin on port: ${PORT}`);
});
