//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC1820Registry} from "@openzeppelin/contracts/interfaces/IERC1820Registry.sol";
import {Errors} from "./libraries/Errors.sol";
import "hardhat/console.sol";

contract Agreement2 is Initializable, OwnableUpgradeable {
    mapping(address => uint256) _toClaim;
    mapping(address => uint256) _claimed;

    string public ipfsMultihash;

    event AcceptedAndClaimed(address indexed owner, string ipfsMultihash, uint256 amount);
    event IpfsMultihashChanged(string ipfsMultihash);
    event ClaimForSet(address owner, uint256 amount);

    function initialize(string calldata _ipfsMultihash) external initializer {
        ipfsMultihash = _ipfsMultihash;
        __Ownable_init();
    }

    function changeIpfsMultihash(string calldata _ipfsMultihash) external onlyOwner {
        ipfsMultihash = _ipfsMultihash;
        emit IpfsMultihashChanged(_ipfsMultihash);
    }

    function acceptAndClaim(string calldata _ipfsMultihash) external {
        if (keccak256(abi.encodePacked((_ipfsMultihash))) != keccak256(abi.encodePacked((ipfsMultihash)))) {
            revert Errors.InvalidIpfsMultiHash();
        }

        address msgSender = _msgSender();
        uint256 amountToClaim = getClaimableAmountFor(msgSender);

        if (amountToClaim == 0) {
            revert Errors.NothingToClaim();
        }

        _acceptAndClaimFor(msgSender, amountToClaim, _ipfsMultihash);
    }

    function acceptAndClaimOwner(uint256 _amount) external onlyOwner {
        _acceptAndClaimFor(_msgSender(), _amount, "");
    }

    function setClaimForMany(address[] calldata _owners, uint256[] calldata _amounts) public onlyOwner {
        if (_owners.length != _amounts.length) {
            revert Errors.InvalidLength();
        }

        for (uint256 i = 0; i < _owners.length; i++) {
            setClaimFor(_owners[i], _amounts[i]);
        }
    }

    function setClaimFor(address _owner, uint256 _amount) public onlyOwner {
        if (_amount == 0) {
            revert Errors.InvalidAmount();
        }

        _toClaim[_owner] = _amount;
        emit ClaimForSet(_owner, _amount);
    }

    function getClaimableAmountFor(address _owner) public view returns (uint256) {
        return _toClaim[_owner] - _claimed[_owner];
    }

    function getClaimedAmountFor(address _owner) public view returns (uint256) {
        return _claimed[_owner];
    }

    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        _send(_msgSender(), _amount);
    }

    function _acceptAndClaimFor(address _owner, uint256 _amount, string memory _ipfsMultihash) internal {
        _claimed[_owner] += _amount;
        _send(_owner, _amount);
        emit AcceptedAndClaimed(_owner, _ipfsMultihash, _amount);
    }

    function _send(address _to, uint256 _amount) internal {
        (bool sent,) = _to.call{value: _amount}("");
        if (!sent) revert Errors.FailedToSendEther();
    }

    fallback() external payable {
        if (_msgSender() != owner()) {
            revert Errors.OnlyOwnerCanDepositToken();
        }
    }
}
