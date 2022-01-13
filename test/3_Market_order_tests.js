const DEX = artifacts.require("DEX");
const BAT = artifacts.require("BAT");
const USDC = artifacts.require("USDC");

const truffleAssertions = require("truffle-assertions");

const SIDE = {
  BUY: 0,
  SELL: 1,
};

contract("DEX", (accounts) => {
  let dex, bat, usdc;
  const [trader1, trader2] = [accounts[1], accounts[2]];

  beforeEach(async () => {
    [dex, bat, usdc] = await Promise.all([DEX.new(), BAT.new(), USDC.new()]);
    await dex.addToken(web3.utils.utf8ToHex("BAT"), bat.address, {
      from: accounts[0],
    });
    await dex.addToken(web3.utils.utf8ToHex("USDC"), usdc.address, {
      from: accounts[0],
    });

    const amount = 1000;
    const initToken = async (token, trader) => {
      await token.faucet(trader, amount);
      await token.approve(dex.address, amount, { from: trader });
    };
    await Promise.all([bat, usdc].map((token) => initToken(token, trader1)));
    await Promise.all([bat, usdc].map((token) => initToken(token, trader2)));
  });

  it("Market orders can be submitted even if the order book is empty", async () => {
    const orderBook = await dex.getOrders(
      web3.utils.utf8ToHex("BAT"),
      SIDE.BUY
    );
    assert(orderBook.length === 0);

    await truffleAssertions.passes(
      dex.createMarketOrder(SIDE.BUY, web3.utils.utf8ToHex("BAT"), 1)
    );
  });

  it("Should create market order and match it with limit order", async () => {
    await dex.deposit(web3.utils.utf8ToHex("USDC"), 100, { from: trader1 });
    await dex.createLimitOrder(SIDE.BUY, web3.utils.utf8ToHex("BAT"), 10, 5, {
      from: trader1,
    });
    await dex.deposit(web3.utils.utf8ToHex("BAT"), 100, { from: trader2 });
    await dex.createMarketOrder(SIDE.SELL, web3.utils.utf8ToHex("BAT"), 7, {
      from: trader2,
    });

    const balances = await Promise.all([
      dex.traderBalances(trader1, web3.utils.utf8ToHex("USDC")),
      dex.traderBalances(trader1, web3.utils.utf8ToHex("BAT")),
      dex.traderBalances(trader2, web3.utils.utf8ToHex("USDC")),
      dex.traderBalances(trader2, web3.utils.utf8ToHex("BAT")),
    ]);

    const orderBook = await dex.getOrders(
      web3.utils.utf8ToHex("BAT"),
      SIDE.BUY
    );

    assert(orderBook.length === 1);
    assert.equal(orderBook[0].amount, 10); // OR: assert(orderBook[0].amount.toString() === "10");
    assert.equal(orderBook[0].filled, 7);
    assert.equal(balances[0].toNumber(), 65); // balance of trader1 [USDC] --> 100 - 7*5 = 65
    assert.equal(balances[1].toNumber(), 7); // balance of trader1 [BAT]
    assert.equal(balances[2].toNumber(), 35); // balance of trader2 [USDC] --> 7*5 = 35
    assert.equal(balances[3].toNumber(), 93); // balance of trader2 [BAT]
  });

  it("Filled limit orders should be removed from the order book", async () => {
    // Before trade
    let orderBook = await dex.getOrders(web3.utils.utf8ToHex("BAT"), SIDE.SELL);
    assert(orderBook.length === 0);

    await dex.deposit(web3.utils.utf8ToHex("BAT"), 100, { from: trader1 });
    await dex.createLimitOrder(SIDE.SELL, web3.utils.utf8ToHex("BAT"), 10, 5, {
      from: trader1,
    });
    await dex.deposit(web3.utils.utf8ToHex("USDC"), 100, { from: trader2 });

    // 1st trade --> partially filling limit order (remaining = amount - filled)
    await dex.createMarketOrder(SIDE.BUY, web3.utils.utf8ToHex("BAT"), 8, {
      from: trader2,
    });
    orderBook = await dex.getOrders(web3.utils.utf8ToHex("BAT"), SIDE.SELL);
    assert.equal(orderBook[0].amount, 10);
    assert.equal(orderBook[0].filled, 8);

    // 2nd trade --> completely filling limit order (amount = filled)
    await dex.createMarketOrder(SIDE.BUY, web3.utils.utf8ToHex("BAT"), 2, {
      from: trader2,
    });

    // After final trade
    orderBook = await dex.getOrders(web3.utils.utf8ToHex("BAT"), SIDE.SELL);
    assert(orderBook.length === 0);
  });
});
