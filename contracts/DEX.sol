//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./Wallet.sol";


contract DEX is Wallet {

    struct Order {
        uint ID;
        address trader;
        Side side;
        bytes32 ticker;
        uint amount;
        uint price;
        uint filled;
        uint timestamp;
    }

    enum Side {
        BUY, SELL
    }

    mapping(bytes32 => mapping(uint => Order[])) public orderBook;

    uint public nextOrderID;
    uint public nextTradeID;
    bytes32 constant USDC = bytes32("USDC");

    event NewTrade(
        uint OrderID, 
        uint tradeID, 
        bytes32 indexed ticker, 
        address indexed trader1, 
        address indexed trader2,
        uint amount,
        uint price,
        uint timestamp
        );

    modifier notUSDC(bytes32 ticker) {
        require(ticker != USDC, "ERROR: USDC cannot be traded");
        _;
    }

    function getOrders(bytes32 ticker, Side side) external view returns(Order[] memory) {
        return orderBook[ticker][uint(side)];
    }

    function getTokens() external view returns(Token[] memory) {
        Token[] memory _tokens = new Token[](tokenList.length);
        for (uint i = 0; i < tokenList.length; i++) {
            _tokens[i] = Token(
            tokens[tokenList[i]].ticker,
            tokens[tokenList[i]].tokenAddress
        );
      }
      return _tokens;
    }

    function createLimitOrder(Side side, bytes32 ticker, uint amount, uint price) external isToken(ticker) notUSDC(ticker) {
        if(side == Side.BUY) {
            require(traderBalances[msg.sender][USDC] >= amount * price, "ERROR: Insufficient USDC balance");
        } else {
            require(traderBalances[msg.sender][ticker] >= amount, "ERROR: Insufficient token balance");
        }

        Order[] storage orders = orderBook[ticker][uint(side)];
        orders.push(Order(nextOrderID, msg.sender, side, ticker, amount, price, 0, block.timestamp));

        // Sorting algorithm
        uint i = orders.length > 0 ? orders.length - 1 : 0;
        while(i > 0) {
            if(side == Side.BUY && orders[i - 1].price > orders[i].price) {
                break;   
            } 
            else if(side == Side.SELL && orders[i - 1].price < orders[i].price) {
                break;
            }
            Order memory order = orders[i - 1];
            orders[i - 1] = orders[i];
            orders[i] = order;
            i--; 
        }
        nextOrderID++;  
    }

    function createMarketOrder(Side side, bytes32 ticker, uint amount) external isToken(ticker) notUSDC(ticker) {
        if(side == Side.SELL) {
            require(traderBalances[msg.sender][ticker] >= amount, "ERROR: Insufficient token balance");
        }

        uint orderBookSide;
        if(side == Side.BUY) {
            orderBookSide = 1;
        } else {
            orderBookSide = 0;
        }

        Order[] storage orders = orderBook[ticker][orderBookSide];

        uint remaining = amount;

        for(uint i=0; i < orders.length && remaining > 0; i++) {
            uint available = orders[i].amount - orders[i].filled;
            uint filled = remaining > available ? available : remaining;
            remaining -= filled;
            orders[i].filled += filled;
            
            uint cost = filled * orders[i].price;  

            if(side == Side.BUY) {
                require(traderBalances[msg.sender][USDC] >= cost, "ERROR: Insufficient USDC balance");

                traderBalances[msg.sender][ticker] += filled;
                traderBalances[msg.sender][USDC] -= cost;
                traderBalances[orders[i].trader][ticker] -= filled;
                traderBalances[orders[i].trader][USDC] += cost;
            } 
            else if(side == Side.SELL) {
                traderBalances[msg.sender][ticker] -= filled;
                traderBalances[msg.sender][USDC] += cost;
                traderBalances[orders[i].trader][ticker] += filled;
                traderBalances[orders[i].trader][USDC] -= cost;
            }

            emit NewTrade(nextTradeID, orders[i].ID, ticker, orders[i].trader, msg.sender, filled, orders[i].price, block.timestamp);
        }

        //Removing 100% filled orders from the orderbook
        for(uint i = 0; i < orders.length && orders[i].filled == orders[i].amount; i++) {
            for(uint j = i; j < orders.length - 1; j++ ) {
                orders[j] = orders[j + 1];
            }
            orders.pop();
        }
    }
}