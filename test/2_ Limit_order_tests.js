const DEX = artifacts.require("DEX");
const UNI = artifacts.require("UNI");
const SAND = artifacts.require("SAND");
const USDC = artifacts.require("USDC");

const truffleAssertions = require("truffle-assertions");

const SIDE = {
  BUY: 0,
  SELL: 1,
};

contract("DEX", (accounts) => {
  let dex, uni, sand, usdc;

  beforeEach(async () => {
    [dex, uni, sand, usdc] = await Promise.all([
      DEX.new(),
      UNI.new(),
      SAND.new(),
      USDC.new(),
    ]);

    await Promise.all([
      dex.addToken(web3.utils.utf8ToHex("UNI"), uni.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("USDC"), usdc.address, {
        from: accounts[0],
      }),
      dex.addToken(web3.utils.utf8ToHex("SAND"), sand.address, {
        from: accounts[0],
      }),
    ]);
    const amount = 2000;
    const initToken = async (token) => {
      await token.faucet(accounts[0], amount);
      await token.approve(dex.address, amount);
    };

    await Promise.all([uni, sand, usdc].map((token) => initToken(token)));
  });

  it("Should successfully create a BUY or SELL limit order", async () => {
    await dex.deposit(web3.utils.utf8ToHex("UNI"), 500);
    await dex.deposit(web3.utils.utf8ToHex("USDC"), 200);
    // BUY
    await truffleAssertions.passes(
      dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("UNI"), 200, 1)
    );
    // SELL
    await truffleAssertions.passes(
      dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("UNI"), 500, 1)
    );
  });

  it("The order book should be ordered correctly on price starting at index 0", async () => {
    // BUY order book - from highest to lowest
    await dex.deposit(web3.utils.utf8ToHex("SAND"), 1000);
    await dex.deposit(web3.utils.utf8ToHex("USDC"), 1000);
    await dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("SAND"), 1, 100);
    await dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("SAND"), 1, 300);
    await dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("SAND"), 1, 200);
    await dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("SAND"), 1, 400);

    let orderBook = await dex.getOrders(web3.utils.utf8ToHex("SAND"), 0);
    assert(orderBook.length > 0);
    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(
        orderBook[i].price >= orderBook[i + 1].price,
        "Wrong order in the order book for the BUY side"
      );
    }
    // SELL order book - from lowest to highest
    await dex.deposit(web3.utils.utf8ToHex("SAND"), 1000);
    await dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("SAND"), 1, 100);
    await dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("SAND"), 1, 300);
    await dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("SAND"), 1, 200);
    await dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("SAND"), 1, 400);

    orderBook = await dex.getOrders(web3.utils.utf8ToHex("SAND"), 1);
    assert(orderBook.length > 0);
    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(
        orderBook[i].price <= orderBook[i + 1].price,
        "Wrong order in the order book for the SELL side"
      );
    }
  });

  it("Should throw an error if USDC balance too low when creating BUY limit order", async () => {
    await truffleAssertions.reverts(
      dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("UNI"), 2001, 1)
    );
  });

  it("Should throw an error if token balance too low when creating SELL limit order", async () => {
    await truffleAssertions.reverts(
      dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("UNI"), 501, 1)
    );
  });

  it("Should NOT create limit order if token doesn't exist", async () => {
    await truffleAssertions.reverts(
      dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("SHIB"), 100, 1)
    );
  });

  it("Should NOT create limit order if token is USDC", async () => {
    await truffleAssertions.reverts(
      dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("USDC"), 100, 1)
    );
  });
});
