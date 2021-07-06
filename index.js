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
let today = new Date();
let date =
  today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

app.get("/dashboard", async (req, res) => {
  const results = await db.query(`SELECT * FROM food_items`);
  const calSum = await db.query(`SELECT SUM(calorie) FROM food_items`);

  //   getting todays calories:
  //   use the date to refine table to just today

  //   const results = await db.query(
  //     `SELECT * FROM food_items WHERE food_date_input = '${date}'`
  //   );
  //   const calSum = await db.query(
  //     `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}'`
  //   );

  console.log(results);
  console.log(calSum);
  res.render("homepage", { locals: { results, calSum, date } });
});

app.post("/food_input", (req, res) => {
  foodInfo = req.body;
  console.log(foodInfo);
  db.none(
    `INSERT INTO food_items (food, calorie, meal, food_date_input, food_time_input) VALUES ('${foodInfo.food}', '${foodInfo.calories}', '${foodInfo.meal}', '${foodInfo.date}', '${foodInfo.time}')`
  );
  res.redirect(`/food_input/confirmation`);
});

app.get("/food_input/confirmation", async (req, res) => {
  res.redirect("/dashboard");
});

app.get("/food_input", (req, res) => {
  res.render("add-food");
});

const PORT = process.env.PORT || 3785;

app.listen(PORT, () => {
  console.log(`listenin on port: ${PORT}`);
});

/*

// this is for further deveoplement //

app.get("/food_input/confirmation", async (req, res) => {
  // render ability to get the info from the table to compare, ability to choose which one with a checkbox?
  const foodDB = await db.any(
    `SELECT food, calorie FROM food_items WHERE food ILIKE '%${foodInfo.food}%'`
  );
  console.log(foodDB);
  res.render("confirm-food", { locals: { foodInfo, foodDB } });
});

app.post("/food_input/confirmation", (req, res) => {
  // need a submit button,
  console.log(req);
  res.redirect(`/dashboard`);
});
*/
