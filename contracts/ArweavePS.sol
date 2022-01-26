//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DaoStaking.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArweavePS is Ownable {
    // The users who are staking can register their arweave address
    // to become eligible for Ar profit sharing rewards

    struct ProfitShare {
        string to;
        bool sharing;
        uint256 index;
    }

    mapping(address => ProfitShare) private sharingTo;
    ProfitShare[] private allPS;
    DaoStaking private staking;

    event SetPS(address indexed _address, string _to);
    event StopPS(address indexed _address);

    function setStakingLib(DaoStaking _staking) external onlyOwner {
        staking = _staking;
    }

    function setPS(string calldata _to) external {
        require(staking.isStaking(msg.sender), "919");

        if (sharingTo[msg.sender].sharing) {
            // If the user has a sharing address already in the array
            // I remove it by setting sharing to false
            allPS[sharingTo[msg.sender].index].sharing = false;
        }
        // Then I create a new ps
        ProfitShare memory ps = ProfitShare({
            to: _to,
            sharing: true,
            index: allPS.length
        });
        // add it
        sharingTo[msg.sender] = ps;
        allPS.push(ps);
        emit SetPS(msg.sender, _to);
    }

    function stoppedStaking(address _address) external {
        // Only the staking contract can call this
        require(msg.sender == address(staking), "920");
        _stopPS(_address);
    }

    function _stopPS(address _address) internal {
        if (sharingTo[_address].index < allPS.length) {
            allPS[sharingTo[_address].index].sharing = false;
            sharingTo[_address].sharing = false;
            emit StopPS(_address);
        }
    }

    // The user can stop to recieve rewards if he wants to
    // in case the Ar key is lost or similar
    function stopPS() external {
        require(sharingTo[msg.sender].sharing, "921");
        _stopPS(msg.sender);
    }

    function getAllPS() external view returns (ProfitShare[] memory) {
        return allPS;
    }

    function getPS(address _address)
        external
        view
        returns (ProfitShare memory)
    {
        return sharingTo[_address];
    }
}
