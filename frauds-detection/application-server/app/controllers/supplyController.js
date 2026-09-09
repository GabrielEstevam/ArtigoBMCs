const { getInstance } = require("../../instance.js");

const addSupply = async (req, res) => {
  const instance = await getInstance();
  console.log("==== new request - Add Supply ====");
  const { fuel, odometer, vehicleId, bmcId } = req.body;

  if (!fuel || !odometer || !vehicleId || !bmcId) {
    res
      .status(400)
      .send(
        "insufficient arguments. Expecting 4, { fuel, odometer, vehicleId, bmcId }"
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
      "\n--> Submit Supply: add new Supply, creates new Supply with fuel, odometer, vehicleId and bmcId"
    );

    const supply = {
      fuel,
      odometer,
      vehicleId,
      bmcId,
    };

    const supplyJSON = JSON.stringify(supply);
    console.log(supplyJSON);

    try {
      result = await contract.submitTransaction("addSupply", supplyJSON);
      result = "Supply Successfully registered";
    } catch (e) {
      console.log(e);
      result = "Error sending Supply Data";
    }
  } finally {
    instance.gateway.disconnect();
  }
  return res.send(result);
};

module.exports = { addSupply };
