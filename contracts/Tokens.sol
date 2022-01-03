//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract LINK is ERC20 {

    constructor() ERC20("ChainLink", "LINK") {
    }

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}

contract UNI is ERC20 {

    constructor() ERC20("Uniswap", "UNI") {
    }

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}

contract BAT is ERC20 {

    constructor() ERC20("Basic Attention Token", "BAT") {
    }

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}

contract SAND is ERC20 {

    constructor() ERC20("The Sandbox", "SAND") {
    }

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}

contract USDC is ERC20 {

    constructor() ERC20("USD Coin", "USDC") {
    }

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}