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

  res.render("homepage", {
    locals: { results, calSum, date, today },
    partials: {
      header: "/partials/header",
      head: "/partials/head",
      footer: "/partials/footer",
    },
  });
});
app.post("/food_input", (req, res) => {
  let actualInputDate;
  let actualInputTime;
  foodInfo = req.body;
  if (foodInfo.today === "Today") {
    actualInputDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    console.log(actualInputDate);
  } else if (foodInfo.today === "user_input") {
    let dbInputMonth = foodInfo.user_input[0];
    let dbInputDay = foodInfo.user_input[1];
    let dbInputYear = foodInfo.user_input[2];
    let actualInputDate = `${dbInputMonth}/${dbInputDay}/${dbInputYear}`;
    console.log(actualInputDate);
  }
  if (foodInfo.time === "Time") {
    actualInputTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(actualInputTime);
  } else if (foodInfo.time === "user_input") {
    let dbInputHour = foodInfo.user_input[3];
    let dbInputMinute = foodInfo.user_input[4];
    let dbInputAP = foodInfo.user_input[5];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
    console.log(actualInputTime);
  } else if (foodInfo.time === "user_input_time") {
    let dbInputHour = foodInfo.user_input[0];
    let dbInputMinute = foodInfo.user_input[1];
    let dbInputAP = foodInfo.user_input[2];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
    console.log(actualInputTime);
  }

  // db.none(
  //   `INSERT INTO food_items (food, calorie, meal, food_date_input, food_time_input) VALUES ('${foodInfo.food}', '${foodInfo.calories}', '${foodInfo.meal}', '${foodInfo.date}', '${foodInfo.time}')`
  // );
  // res.redirect(`/food_input/confirmation`);
});

app.get("/food_input/confirmation", async (req, res) => {
  res.redirect("/dashboard");
});

app.get("/food_input", (req, res) => {
  res.render("add-food", {
    partials: {
      header: "/partials/header",
      head: "/partials/head",
      footer: "/partials/footer",
    },
  });
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

// time formatting //
 const timeFormatFunc = function (str) {
    let minutes = str.slice(3, 5);
    let hours = str.slice(0, 2);
    let militaryTimeInt = parseInt(hours + minutes);
    if (militaryTimeInt > 2359 || minutes >= 60) {
      return "Not A Valid Time";
    }
    let mornEve = parseInt(hours) < 11 ? "am" : "pm";
    let hours12 = parseInt(hours) - 12 < 0 ? hours : hours - 12;
    return `${hours12}:${parseInt(minutes)} ${mornEve}`;
  };

*/
