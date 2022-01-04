const DEX = artifacts.require("DEX");
const LINK = artifacts.require("LINK");
const UNI = artifacts.require("UNI");
const BAT = artifacts.require("BAT");
const SAND = artifacts.require("SAND");
const USDC = artifacts.require("USDC");
const truffleAssertions = require("truffle-assertions");

contract("DEX", (accounts) => {
  let dex, link, uni, bat, sand, usdc;

  beforeEach(async () => {
    [dex, link, bat, uni, sand, usdc] = await Promise.all([
      DEX.deployed(),
      LINK.deployed(),
      UNI.deployed(),
      BAT.deployed(),
      SAND.deployed(),
      USDC.deployed(),
    ]);
    await Promise.all([
      dex.addToken(web3.utils.utf8ToHex("LINK"), link.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("UNI"), uni.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("BAT"), bat.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("SAND"), sand.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("USDC"), usdc.address, {
        from: accounts[0],
      }),
    ]);
  });

  it("Only manager should be able to add new tokens", async () => {
    await truffleAssertions.passes(
      dex.addToken(web3.utils.utf8ToHex("LINK"), link.address, {
        from: accounts[0],
      })
    );
  });

  it("Not manager should NOT be able to add new tokens", async () => {
    await truffleAssertions.reverts(
      dex.addToken(web3.utils.utf8ToHex("BAT"), bat.address, {
        from: accounts[1],
      })
    );
  });

  it("Should manage deposits correctly", async () => {
    const amount = web3.utils.toWei("1000");
    await uni.faucet(accounts[0], amount);
    await uni.approve(dex.address, 100, { from: accounts[0] });
    await dex.deposit(web3.utils.utf8ToHex("UNI"), 50);
    let balance = await dex.traderBalances(
      accounts[0],
      web3.utils.utf8ToHex("UNI")
    );
    assert(balance.toString() === "50");
  });

  it("Should manage withdrawals correctly", async () => {
    // happy path
    await truffleAssertions.passes(
      dex.withdraw(web3.utils.utf8ToHex("UNI"), 50)
    );
    // unhappy path
    await truffleAssertions.reverts(
      dex.withdraw(web3.utils.utf8ToHex("UNI"), 51)
    );
  });

  it("Should NOT deposit or withdraw tokens that aren't added yet", async () => {
    // deposit
    await truffleAssertions.reverts(
      dex.deposit(web3.utils.utf8ToHex("HEX"), 100)
    );
    // withdraw
    await truffleAssertions.reverts(
      dex.withdraw(web3.utils.utf8ToHex("SHIB"), 100)
    );
  });
});
