//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct TrailDetails {
    address creator;
    uint8 access;
    bool initialized;
}
bytes32 constant EMPTYSTRING = keccak256(abi.encodePacked(""));

contract TrailsRegistry {
    mapping(bytes32 => TrailDetails) private trails;
    mapping(bytes32 => string[]) private content;
    mapping(bytes32 => string[]) private blacklist;

    event NewTrails(string trailId, address creator);
    event Add(string trailId, address creator, string data);
    event Blacklist(string trailId, address creator, string data);

    function newTrail(string memory _trailId_, uint8 access) external {
        bytes32 trailId = hashString(_trailId_);

        require(trailId != EMPTYSTRING, "956");
        require(
            trails[trailId].initialized == false,
            "That trail already exists!"
        );
        require(access == 0 || access == 1, "960");

        trails[trailId] = TrailDetails({
            creator: msg.sender,
            initialized: true,
            access: access
        });
        emit NewTrails(_trailId_, msg.sender);
    }

    function hashString(string memory strng) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(strng));
    }

    function add(string memory _trailId_, string memory data) external {
        bytes32 trailId = hashString(_trailId_);
        require(trails[trailId].initialized, "957");
        require(msg.sender == trails[trailId].creator, "958");

        require(hashString(data) != EMPTYSTRING, "959");
        require(bytes(data).length == 43, "959");

        content[trailId].push(data);
        emit Add(_trailId_, msg.sender, data);
    }

    function blackList(string memory _trailId_, string memory data) external {
        bytes32 trailId = hashString(_trailId_);
        require(trails[trailId].initialized == true, "957");
        require(msg.sender == trails[trailId].creator, "958");
        blacklist[trailId].push(data);
        emit Blacklist(_trailId_, msg.sender, data);
    }

    function getBlackList(string memory _trailId_)
        external
        view
        returns (string[] memory)
    {
        bytes32 trailId = hashString(_trailId_);
        return blacklist[trailId];
    }

    function getTrailDetails(string memory _trailId_)
        external
        view
        returns (TrailDetails memory)
    {
        bytes32 trailId = hashString(_trailId_);
        return trails[trailId];
    }

    function getTrailContent(string memory _trailId_)
        external
        view
        returns (string[] memory)
    {
        bytes32 trailId = hashString(_trailId_);
        return content[trailId];
    }
}
