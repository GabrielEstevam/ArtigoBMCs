const { getInstance } = require("../../instance.js");

const addBmc = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Add BMC ====");
  const { id, fuelType } = req.body;

  if (!id || !fuelType) {
    res
      .status(400)
      .send("Insufficient parameters, expecting 2, { id, fuelType }.");
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
      "\n--> Submit BMC: add new BMC, creates new BMC with ID and fuelType"
    );

    const bmc = {
      id: id,
      fuelType: fuelType,
    };

    const bmcJSON = JSON.stringify(bmc);
    console.log(bmcJSON);

    try {
      result = await contract.submitTransaction("addBmc", bmcJSON);
      result = "BMC Successfully registered";
    } catch (e) {
      console.log(e);
      result = "Error sending BMC Data";
    }
  } finally {
    instance.gateway.disconnect();
  }
  return res.send(result);
};

const getBmc = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Get BMC ====");
  let result;
  const { id } = req.body;

  if (!id) {
    res.status(400).send("Insufficient parameters, expecting 1, { id }");
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
    console.log(`\n--> Query: get BMC for ID ${id}`);

    const bmc = {
      id: "B" + id,
    };

    const bmcJSON = JSON.stringify(bmc);
    console.log(bmcJSON);

    try {
      result = await contract.evaluateTransaction("query", bmcJSON);
      result = result.toString();
    } catch (e) {
      console.log(e);
      result = "Error getting BMC Data";
    }
  } finally {
    instance.gateway.disconnect();
  }

  res.send(result);
};

const evaluateBmcRating = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Evaluate BMC Rating ====");
  let result;
  const { id } = req.body;

  if (!id) {
    res.status(400).send("Insufficient parameters, expecting 1, { id }");
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
    console.log(`\n--> Request: update BMC rating for ID ${id}`);

    const bmc = {
      id: "B" + id,
    };

    const bmcJSON = JSON.stringify(bmc);
    console.log(bmcJSON);

    try {
      result = await contract.submitTransaction("evaluateBmcRating", bmcJSON);
      result = result.toString();
    } catch (e) {
      console.log(e);
      result = "Error getting BMC Data";
    }
  } finally {
    instance.gateway.disconnect();
  }

  res.send(result);
};

const evaluateAllBmcRating = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Evaluate All BMCs Rating ====");
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
    console.log(`\n--> Request: update all BMCs rating`);

    try {
      result = await contract.submitTransaction("evaluateAllBmcRating");
      result = result.toString();
    } catch (e) {
      console.log(e);
      result = "Error getting BMC Data";
    }
  } finally {
    instance.gateway.disconnect();
  }

  res.send(result);
};

module.exports = { addBmc, getBmc, evaluateBmcRating, evaluateAllBmcRating };
