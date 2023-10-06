//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC1820Registry} from "@openzeppelin/contracts/interfaces/IERC1820Registry.sol";
import {Errors} from "./libraries/Errors.sol";

contract Agreement2 is Initializable, OwnableUpgradeable {
    mapping(address => uint256) _toClaim;
    mapping(address => uint256) _claimed;

    string public ipfsMultihash;

    event AcceptedAndClaimed(address indexed owner, string ipfsMultihash, uint256 amount);
    event IpfsMultihashChanged(string ipfsMultihash);
    event ClaimForSet(address owner, uint256 amount);

    function initialize(string calldata ipfsMultihash_) external initializer {
        ipfsMultihash = ipfsMultihash_;
        __Ownable_init();
    }

    function changeIpfsMultihash(string calldata ipfsMultihash_) external onlyOwner {
        ipfsMultihash = ipfsMultihash_;
        emit IpfsMultihashChanged(ipfsMultihash_);
    }

    function acceptAndClaim(string calldata ipfsMultihash_) external {
        if (keccak256(abi.encode((ipfsMultihash_))) != keccak256(abi.encode((ipfsMultihash)))) {
            revert Errors.InvalidIpfsMultiHash();
        }

        address msgSender = _msgSender();
        uint256 amountToClaim = getClaimableAmountFor(msgSender);

        if (amountToClaim == 0) {
            revert Errors.NothingToClaim();
        }

        _acceptAndClaimFor(msgSender, msgSender, amountToClaim, ipfsMultihash_);
    }

    function acceptAndClaimManyOwner(address[] calldata owners) external onlyOwner {
        address msgSender = _msgSender();
        for (uint256 i = 0; i < owners.length; i++) {
            uint256 amountToClaim = getClaimableAmountFor(owners[i]);
            _acceptAndClaimFor(owners[i], msgSender, amountToClaim, "");
        }
    }

    function acceptAndClaimOwner(address owner) external onlyOwner {
        uint256 amountToClaim = getClaimableAmountFor(owner);
        _acceptAndClaimFor(owner, _msgSender(), amountToClaim, "");
    }

    function setClaimForMany(address[] calldata owners, uint256[] calldata amounts) external onlyOwner {
        if (owners.length != amounts.length) {
            revert Errors.InvalidLength();
        }

        for (uint256 i = 0; i < owners.length; i++) {
            setClaimFor(owners[i], amounts[i]);
        }
    }

    function setClaimFor(address owner, uint256 amount) public onlyOwner {
        if (amount == 0) {
            revert Errors.InvalidAmount();
        }

        _toClaim[owner] = amount;
        emit ClaimForSet(owner, amount);
    }

    function getClaimableAmountFor(address owner) public view returns (uint256) {
        return _toClaim[owner] - _claimed[owner];
    }

    function getClaimedAmountFor(address owner) external view returns (uint256) {
        return _claimed[owner];
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        _send(_msgSender(), amount);
    }

    function _acceptAndClaimFor(address owner, address _receiver, uint256 amount, string memory ipfsMultihash_) internal {
        _claimed[owner] += amount;
        _send(_receiver, amount);
        emit AcceptedAndClaimed(owner, ipfsMultihash_, amount);
    }

    function _send(address _to, uint256 amount) internal {
        (bool sent, ) = _to.call{value: amount}("");
        if (!sent) revert Errors.FailedToSendEther();
    }

    receive() external payable {
        if (_msgSender() != owner()) {
            revert Errors.OnlyOwnerCanDepositToken();
        }
    }
}
