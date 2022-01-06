const DEX = artifacts.require("DEX");
const LINK = artifacts.require("LINK");
const UNI = artifacts.require("UNI");
const BAT = artifacts.require("BAT");

const truffleAssertions = require("truffle-assertions");

contract.skip("DEX - Wallet", (accounts) => {
  let dex, link, uni, bat;

  beforeEach(async () => {
    [dex, link, bat, uni] = await Promise.all([
      DEX.deployed(),
      LINK.deployed(),
      UNI.deployed(),
      BAT.deployed(),
    ]);
  });

  it("Only manager should be able to add new tokens", async () => {
    await truffleAssertions.passes(
      dex.addToken(web3.utils.utf8ToHex("LINK"), link.address, {
        from: accounts[0],
      })
    );
  });

  it("It shouldn't be possible to add new tokens more than once", async () => {
    await truffleAssertions.reverts(
      dex.addToken(web3.utils.utf8ToHex("LINK"), link.address, {
        from: accounts[0],
      })
    );
  });

  it("Non manager should NOT be able to add new tokens", async () => {
    await truffleAssertions.reverts(
      dex.addToken(web3.utils.utf8ToHex("BAT"), bat.address, {
        from: accounts[1],
      })
    );
  });

  it("Should manage deposits correctly", async () => {
    await dex.addToken(web3.utils.utf8ToHex("UNI"), uni.address, {
      from: accounts[0],
    });
    await uni.faucet(accounts[0], 1000);
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
