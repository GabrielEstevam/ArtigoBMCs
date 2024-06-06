const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const {
  buildCAClient,
  registerAndEnrollUser,
  enrollAdmin,
} = require("../../test-application/javascript/CAUtil.js");
const {
  buildCCPOrg1,
  buildWallet,
} = require("../../test-application/javascript/AppUtil.js");

const channelName = "mychannel";
const chaincodeName = "frauds-detection-cc";
const mspOrg1 = "Org1MSP";
const walletPath = path.join(__dirname, "wallet");
const org1UserId = "appUser";

let instance;

class Instance {
  constructor() {
    this.init();
  }

  async init() {
    try {
      this.channelName = channelName;
      this.chaincodeName = chaincodeName;
      this.mspOrg1 = mspOrg1;
      this.walletPath = walletPath;
      this.org1UserId = org1UserId;

      this.ccp = buildCCPOrg1();

      this.caClient = buildCAClient(
        FabricCAServices,
        this.ccp,
        "ca.org1.example.com"
      );

      this.wallet = await buildWallet(Wallets, walletPath);

      await enrollAdmin(this.caClient, this.wallet, mspOrg1);

      await registerAndEnrollUser(
        this.caClient,
        this.wallet,
        mspOrg1,
        org1UserId,
        "org1.department1"
      );

      this.gateway = new Gateway();
    } catch (error) {
      console.error(`******** FAILED to run the application: ${error}`);
    }
  }
}

async function getInstance() {
  if (!instance) {
    instance = new Instance();
    await instance.init();
  }

  return instance;
}

module.exports = { getInstance };
