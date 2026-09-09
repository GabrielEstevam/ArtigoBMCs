"use strict";

const express = require("express");
const router = require("./app/routes/index.js");
const { getInstance } = require("./instance.js");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

const instance = getInstance();
