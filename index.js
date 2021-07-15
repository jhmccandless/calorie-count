"use strict";

require("dotenv").config();

// Imports //
const express = require("express");
const es6Renderer = require("express-es6-template-engine");
const pgp = require("pg-promise")({});
const dbsettings = process.env.DATABASE_URL || { database: "kcalorie" };
const db = pgp(dbsettings);
const app = express();
const session = require("express-session");

const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_SECRET;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3785/login-return",
    },
    function (accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's GitHub profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the GitHub account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  )
);

// Rendering //
app.engine("html", es6Renderer);
app.set("views", "templates");
app.set("view engine", "html");
app.use("/public", express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    httpOnly: false,
    secret: process.env.SECRET_KEY || "dev",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10000 }, // make longer
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  if (request.session.user) {
    next();
  } else if (
    request.path == "/login" ||
    request.path == "/login-return" ||
    request.path == "/"
  ) {
    next();
  } else {
    response.redirect("/login");
  }
});

let foodInfo;
let today = new Date();
let date =
  today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

app.get("/", function (request, response) {
  response.send(`Hello ${request.session.user}`);
});

app.get(
  "/login",
  passport.authenticate("github", { scope: ["user:email"] })
  // function (req, res) {
  //   The request will be redirected to GitHub for authentication, so this
  //   function will not be called.
  // }
);

app.get(
  "/login-return",
  passport.authenticate("github", { failureRedirect: "/login-failure" }),
  async function (req, res) {
    console.log(req.user);
    req.session.user = req.user.username;
    req.session.userFullName = req.user.displayName;
    req.session.userGitID = req.user.id;
    req.session.location = req.user.location;
    let userCheck = await db.any(
      `SELECT username FROM users WHERE username ILIKE '%${req.session.user}%'`
    );

    console.log(userCheck);

    if (!userCheck[0]) {
      console.log("new user");
      await db.none(
        `INSERT INTO users (username, name, location, git_id) VALUES ('${req.session.user}', '${req.session.userFullName}', '${req.session.location}', ${req.session.userGitID})`
      );
    } else {
      console.log("return user");
    }

    res.redirect("/dashboard");
  }
);

app.get("/dashboard", async (req, res) => {
  // get session.user and make on url
  const results = await db.query(
    `SELECT * FROM food_items WHERE user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSum = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  //   getting todays calories:
  //   use the date to refine table to just today

  //   const results = await db.query(
  //     `SELECT * FROM food_items WHERE food_date_input = '${date}'`
  //   );
  //   const calSum = await db.query(
  //     `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}'`
  //   );

  res.render("homepage", {
    locals: { results, calSum, date, today, session: req.session },
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
  } else if (foodInfo.today === "user_input") {
    let dbInputMonth = foodInfo.user_input[0];
    let dbInputDay = foodInfo.user_input[1];
    let dbInputYear = foodInfo.user_input[2];
    actualInputDate = `${dbInputYear}/${dbInputMonth}/${dbInputDay}`;
  }
  if (foodInfo.time === "Time") {
    actualInputTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(actualInputTime);
  } else if (foodInfo.time === "user_input_time") {
    let dbInputHour = foodInfo.user_input[3];
    let dbInputMinute = foodInfo.user_input[4];
    let dbInputAP = foodInfo.user_input[5];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
    console.log(actualInputTime);
  } else if (foodInfo.time === "user_input") {
    let dbInputHour = foodInfo.user_input[0];
    let dbInputMinute = foodInfo.user_input[1];
    let dbInputAP = foodInfo.user_input[2];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
    console.log(actualInputTime);
  }
  db.none(
    `INSERT INTO food_items (food, calorie, meal, food_date_input, food_time_input, user_id) VALUES ('${
      foodInfo.food
    }', '${foodInfo.calories}', '${
      foodInfo.meals
    }', '${actualInputDate}', '${actualInputTime}', ${parseInt(
      req.session.userGitID
    )})`
  );
  res.redirect(`/food_input/confirmation`);
});

app.get("/food_input/confirmation", async (req, res) => {
  res.redirect("/dashboard");
});

app.get("/cal_details", async (req, res) => {
  res.render("detail", {
    partials: {
      header: "/partials/header",
      head: "/partials/head",
      footer: "/partials/footer",
    },
  });
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

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    req.logOut();
    req.session = null;
    res.redirect("/"); //Inside a callback… bulletproof!
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
