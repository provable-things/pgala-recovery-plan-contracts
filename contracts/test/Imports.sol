//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract PToken is ERC777 {
    constructor(string memory _name, string memory _symbol, uint256 _amount) ERC777(_name, _symbol, new address[](0)) {
        _mint(msg.sender, _amount, "", "");
    }
}
