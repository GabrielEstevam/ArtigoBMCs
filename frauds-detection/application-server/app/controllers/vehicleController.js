const { getInstance } = require("../../instance.js");

const addVehicle = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Add Vehicle ====");
  const { id, perfil, consumption, tankCapacity, odometer } = req.body;

  if (!id || !perfil || !consumption || !tankCapacity || !odometer) {
    res
      .status(400)
      .send(
        "insufficient arguments. Expecting 5, {id, perfil, consumption, tankCapacity, odometer}"
      );
    return;
  }

  let result;
  try {
    await instance.gateway.connect(instance.ccp, {
      wallet: instance.wallet,
      identity: instance.org1UserId,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await instance.gateway.getNetwork(instance.channelName);

    const contract = network.getContract(instance.chaincodeName);

    // Submit a Transaction
    console.log(
      "\n--> Submit Vehicle: add new Vehicle, creates new Vehicle with id, perfil, consumption, tankCapacity and odometer"
    );

    const vehicle = {
      id,
      perfil,
      consumption,
      tankCapacity,
      odometer,
    };

    const vehicleJSON = JSON.stringify(vehicle);
    console.log(vehicleJSON);

    try {
      result = await contract.submitTransaction("addVehicle", vehicleJSON);
      result = "Vehicle Successfully registered";
    } catch (e) {
      console.log(e);
      result = "Error sending Vehicle Data";
    }
  } finally {
    instance.gateway.disconnect();
  }
  return res.send(result);
};

const getVehicle = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Get Vehicle ====");
  let result;
  const { id } = req.body;

  if (!id) {
    res.status(400).send("insufficient arguments. Expecting 1, { id }");
    return;
  }

  try {
    await instance.gateway.connect(instance.ccp, {
      wallet: instance.wallet,
      identity: instance.org1UserId,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await instance.gateway.getNetwork(instance.channelName);

    const contract = network.getContract(instance.chaincodeName);

    // Submit a Transaction
    console.log(`\n--> Query: get Vehicle for ID ${id}`);

    const vehicle = {
      id: "V" + id,
    };

    const vehicleJSON = JSON.stringify(vehicle);
    console.log(vehicleJSON);

    try {
      result = await contract.evaluateTransaction("query", vehicleJSON);
      result = result.toString();
    } catch (e) {
      console.log(e);
      result = "Error getting Vehicle Data";
    }
  } finally {
    instance.gateway.disconnect();
  }

  res.send(result);
};

module.exports = { addVehicle, getVehicle };
