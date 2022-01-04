//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Wallet {

    address public manager;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    mapping(address => mapping(bytes32 => uint)) public traderBalances;

    modifier onlyManager() {
        require(msg.sender == manager, "ERROR: Only manager allowed");
        _;
    }

    modifier isToken(bytes32 token) {
        require(tokens[token].tokenAddress != address(0), "ERROR: This token doesn't exist");
        _;
    }

    constructor () {
        manager = msg.sender;
    }

    function addToken(bytes32 ticker, address tokenAddress) external onlyManager {
        require(tokens[ticker].tokenAddress == address(0), "ERROR: Token already added");
        tokens[ticker] = Token(ticker, tokenAddress);
        tokenList.push(ticker);
    } 

    function deposit(bytes32 ticker, uint amount) external isToken(ticker) {
        IERC20(tokens[ticker].tokenAddress).transferFrom(msg.sender, address(this), amount);
        traderBalances[msg.sender][ticker] += amount;
    }

    function withdraw(bytes32 ticker, uint amount) external isToken(ticker) {
        require(traderBalances[msg.sender][ticker] >= amount, "ERROR: Insufficient balance");
        traderBalances[msg.sender][ticker] -= amount;
        IERC20(tokens[ticker].tokenAddress).transfer(msg.sender, amount);
    }
}