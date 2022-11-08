//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC777RecipientUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import {IERC1820Registry} from "@openzeppelin/contracts/interfaces/IERC1820Registry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "./libraries/Errors.sol";

contract Agreement is Initializable, OwnableUpgradeable, IERC777RecipientUpgradeable {
    mapping(address => uint256) _toClaim;
    mapping(address => uint256) _claimed;

    string public ipfsMultihash;
    address public token;

    event AcceptedAndClaimed(address indexed owner, string ipfsMultihash, uint256 amount);
    event IpfsMultihashChanged(string ipfsMultihash);
    event ClaimForSet(address owner, uint256 amount);

    function initialize(string calldata _ipfsMultihash, address _token) external initializer {
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24).setInterfaceImplementer(
            address(this),
            keccak256("ERC777TokensRecipient"),
            address(this)
        );
        ipfsMultihash = _ipfsMultihash;
        token = _token;
        __Ownable_init();
    }

    function tokensReceived(
        address, /*_operator*/
        address _from,
        address, /*_to*/
        uint256, /*_amount,*/
        bytes calldata, /* _userData, */
        bytes calldata /*_operatorData */
    ) external view override {
        if (_msgSender() == token && _from != owner()) {
            revert Errors.OnlyOwnerCanDepositToken();
        }
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

        _claimed[msgSender] += amountToClaim;
        IERC20(token).transfer(msgSender, amountToClaim);

        emit AcceptedAndClaimed(msgSender, _ipfsMultihash, amountToClaim);
    }

    function setClaimForMany(address[] calldata _owners, uint256[] calldata _amounts) public onlyOwner {
        for (uint256 i = 0; i < _owners.length; i++) {
            setClaimFor(_owners[i], _amounts[i]);
        }
    }

    function setClaimFor(address _owner, uint256 _amount) public onlyOwner {
        _toClaim[_owner] = _amount;
        emit ClaimForSet(_owner, _amount);
    }

    function getClaimableAmountFor(address _owner) public view returns (uint256) {
        return _toClaim[_owner] - _claimed[_owner];
    }

    function getAlreadyClaimedAmountFor(address _owner) public view returns (uint256) {
        return _claimed[_owner];
    }
}
