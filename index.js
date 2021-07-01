"use strict";

const http = require("http");
const express = require("express");
const es6Renderer = require("express-es6-template-engine");
const exp = require("constants");
const pgp = require("pg-promise")({});
const dbsettings = process.env.DATABASE_URL || { database: "jasonmccandless" };
const db = pgp(dbsettings);

const server = http.createServer(app);
const app = express();

app.engine("html", es6Renderer);
app.set("views", "templates");
app.set("view engine", "html");
app.use("/public", express.static("public"));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3785;

server.listen(PORT, () => {
  `listenin on port: ${port}`;
});
