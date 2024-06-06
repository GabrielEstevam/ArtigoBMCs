const express = require("express");
const {
  addBmc,
  getBmc,
  evaluateBmcRating,
  evaluateAllBmcRating,
} = require("../controllers/bmcController.js");
const {
  addVehicle,
  getVehicle,
} = require("../controllers/vehicleController.js");
const { addSupply } = require("../controllers/supplyController.js");

const router = express.Router();

router.post("/addBmc", addBmc);

router.get("/getBmc", getBmc);

router.get("/evaluateBmcRating", evaluateBmcRating);

router.get("/evaluateAllBmcRating", evaluateAllBmcRating);

router.post("/addVehicle", addVehicle);

router.get("/getVehicle", getVehicle);

router.post("/addSupply", addSupply);

module.exports = router;
