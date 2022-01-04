const Wallet = artifacts.require("Wallet");
const DEX = artifacts.require("DEX");

const LINK = artifacts.require("LINK");
const UNI = artifacts.require("UNI");
const BAT = artifacts.require("BAT");
const SAND = artifacts.require("SAND");
const USDC = artifacts.require("USDC");

module.exports = async (deployer) => {
  await Promise.all(
    [Wallet, DEX, LINK, UNI, BAT, SAND, USDC].map((contract) =>
      deployer.deploy(contract)
    )
  );
};
