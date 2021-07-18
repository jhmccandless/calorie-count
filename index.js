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
app.use(passport.initialize());
app.use(passport.session());
app.use(
  session({
    httpOnly: false,
    secret: process.env.SECRET_KEY || "dev",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000000 }, // make longer
  })
);

let foodInfo;
let today = new Date();
let date =
  today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

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

app.use(function (request, response, next) {
  if (request.session.user) {
    next();
  } else if (request.path == "/login-return" || request.path == "/") {
    console.log("testing 1");
    next();
  } else {
    console.log("testing 2");
    response.redirect("/login-return");
  }
  // response.redirect("/login-return");
});

app.get(
  "/login",
  // passport.authenticate(
  //   "github",
  //   {
  //     scope: ["user:email"],
  //   },
  function (req, res) {
    console.log(req.headers.cookie);
    console.log(req.session);
    console.log(req.sessionID);
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
    // res.redirect("/login-return");
    req.session = null;
    console.log(req.headers);
    res.redirect("/login-return");
  }
  // )
);

app.get(
  "/login-return",
  passport.authenticate("github", { failureRedirect: "/login-failure" }),
  async function (req, res) {
    // console.log(req.user);
    req.session.user = req.user.username;
    req.session.userFullName = req.user.displayName;
    req.session.userGitID = req.user.id;
    req.session.location = req.user.location;
    let userCheck = await db.any(
      `SELECT username FROM users WHERE username ILIKE '%${req.session.user}%'`
    );

    // console.log(userCheck);
    console.log("got to return");
    if (!userCheck[0]) {
      // console.log("new user");
      await db.none(
        `INSERT INTO users (username, name, location, git_id) VALUES ('${req.session.user}', '${req.session.userFullName}', '${req.session.location}', ${req.session.userGitID})`
      );
      res.redirect("/dashboard");
    } else {
      // console.log("return user");
      res.redirect("/dashboard");
    }
  }
);

app.get("/dashboard", async (req, res) => {
  // get session.user and make on url
  const results = await db.query(
    `SELECT * FROM food_items WHERE food_date_input = '${date}' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  for (let i = 0; i < results.length; i++) {
    results[i].timeFormatted = timeFormatFunc(results[i].food_time_input);
  }
  const calSum = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND user_id = ${parseInt(
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
  console.log("trujg to insert food");
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
  } else if (foodInfo.time === "user_input_time") {
    let dbInputHour = foodInfo.user_input[3];
    let dbInputMinute = foodInfo.user_input[4];
    let dbInputAP = foodInfo.user_input[5];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
  } else if (foodInfo.time === "user_input") {
    let dbInputHour = foodInfo.user_input[0];
    let dbInputMinute = foodInfo.user_input[1];
    let dbInputAP = foodInfo.user_input[2];
    actualInputTime = `${dbInputHour}:${dbInputMinute} ${dbInputAP}`;
  }

  console.log(actualInputDate, actualInputTime);

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
  const resultsDay = await db.query(
    `SELECT * FROM food_items WHERE food_date_input = '${date}' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumDay = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const resultsWeek = await db.query(
    `SELECT * FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND user_id = ${parseInt(
      req.session.userGitID
    )}ORDER BY food_date_input ASC`
  );
  const calSumWeek = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const resultsMonth = await db.query(
    `SELECT * FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '30 days' AND user_id = ${parseInt(
      req.session.userGitID
    )} ORDER BY food_date_input ASC`
  );
  const calSumMonth = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '30 days' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumTodayBreak = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND meal = 'breakfast' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumTodayLunch = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND meal = 'lunch' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumTodayDinner = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND meal = 'dinner' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumTodaySnack = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input = '${date}' AND meal = 'snack' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumWeekBreak = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'breakfast' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumWeekLunch = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE meal = 'lunch' AND food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumWeekDinner = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'dinner' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumWeekSnack = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'snack' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumMonthBreak = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'breakfast' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumMonthLunch = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE meal = 'lunch' AND food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumMonthDinner = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'dinner' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );
  const calSumMonthSnack = await db.query(
    `SELECT SUM(calorie) FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days' AND meal = 'snack' AND user_id = ${parseInt(
      req.session.userGitID
    )}`
  );

  for (let i = 0; i < resultsDay.length; i++) {
    resultsDay[i].timeFormatted = timeFormatFunc(resultsDay[i].food_time_input);
  }
  for (let i = 0; i < resultsWeek.length; i++) {
    resultsWeek[i].timeFormatted = timeFormatFunc(
      resultsWeek[i].food_time_input
    );
  }
  for (let i = 0; i < resultsMonth.length; i++) {
    resultsMonth[i].timeFormatted = timeFormatFunc(
      resultsMonth[i].food_time_input
    );
  }
  // getting all within the past 7 days:
  // SELECT * FROM food_items WHERE food_date_input >= date_trunc('day', now()) - INTERVAL '7 days'

  // getting the month
  // SELECT * FROM food_items WHERE food_date_input >= date_trunc('month', now()) - INTERVAL '1 month'
  res.render("detail", {
    locals: {
      resultsDay,
      calSumDay,
      resultsMonth,
      calSumMonth,
      date,
      today,
      session: req.session,
      resultsWeek,
      calSumWeek,
      calSumTodayBreak,
      calSumTodayLunch,
      calSumTodayDinner,
      calSumTodaySnack,
      calSumWeekBreak,
      calSumWeekLunch,
      calSumWeekDinner,
      calSumWeekSnack,
      calSumMonthBreak,
      calSumMonthLunch,
      calSumMonthDinner,
      calSumMonthSnack,
    },
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
  res.clearCookie("connect.sid");
  req.session.destroy(function (err) {
    req.session = null;
    req.user = null;
    req.logOut();
    console.log("logged out");
  });
  res.render("logout");
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
