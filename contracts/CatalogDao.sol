//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./libraries/CatalogDaoLib.sol";

contract CatalogDao {
    using CatalogDaoLib for CatalogState;
    CatalogState private state;

    event NewRankProposal(address indexed from, string repository);
    event RankVote(address indexed from, uint256 rankIndex, bool accepted);
    event ClosingRankVote(address indexed from, uint256 rankIndex);
    event NewSmartContractProposal(address indexed from, string arweaveTxId);
    event VoteOnNewSmartContract(
        address indexed from,
        uint256 index,
        bool accepted
    );
    event CloseSmartContractProposal(address indexed from, uint256 index);
    event NewRemovalProposal(
        address indexed from,
        string discussionUrl,
        uint256 accetedIndex,
        bool malicious
    );
    event VoteOnRemoval(address indexed from, uint256 index, bool accepted);
    event CloseRemovalProposal(address indexed from, uint256 index);

    constructor(uint256 pollPeriod) {
        // The creator of the contract gets elevated privilage and 10 rank points.
        // For other users, max rank is 3, but 10 is needed to pass the voting.
        state.rank[msg.sender] = 10;

        state.pollPeriod = pollPeriod; //302400, Estimate of  how many Harmony blocks are in a week.
    }

    // <-- Rank functions start -->
    function proposeNewRank(string calldata _repository)
        external
        returns (uint256)
    {
        emit NewRankProposal(msg.sender, _repository);
        return state.proposeNewRank(_repository);
    }

    function getRank(address _address) public view returns (uint8) {
        return state.rank[_address];
    }

    function getRankProposalIndex() external view returns (uint256) {
        return state.rankProposalIndex;
    }

    function getRankProposalsByIndex(uint256 index)
        external
        view
        returns (RankProposal memory)
    {
        return state.rankProposals[index];
    }

    function votedAlreadyOnRank(uint256 rankIndex, address _voter)
        external
        view
        returns (bool)
    {
        return state.votedAlreadyOnRank(rankIndex, _voter);
    }

    function voteOnNewRank(uint256 rankIndex, bool accepted)
        external
        returns (bool)
    {
        emit RankVote(msg.sender, rankIndex, accepted);
        return state.voteOnNewRank(rankIndex, accepted);
    }

    function closeRankProposal(uint256 rankIndex) external returns (bool) {
        emit ClosingRankVote(msg.sender, rankIndex);
        return state.closeRankProposal(rankIndex);
    }

    //<-- Rank functions end -->

    // A getter for fetching all my own proposals
    function getMyProposals() external view returns (MyProposals memory) {
        return state.myProposals[msg.sender];
    }

    //<-- Smart contract proposal functions start -->

    function proposeNewSmartContract(string calldata _arweaveTxId)
        external
        returns (uint256)
    {
        emit NewSmartContractProposal(msg.sender, _arweaveTxId);
        return state.proposeNewSmartContract(_arweaveTxId);
    }

    function getSmartContractProposalIndex() external view returns (uint256) {
        return state.smartContractProposalIndex;
    }

    function getSmartContractProposalsByIndex(uint256 index)
        external
        view
        returns (SmartContractProposal memory)
    {
        return state.smartContractProposals[index];
    }

    function votedAlreadyOnSmartContract(uint256 sCIndex, address _voter)
        external
        view
        returns (bool)
    {
        return state.votedAlreadyOnSC(sCIndex, _voter);
    }

    function voteOnNewSmartContract(uint256 sCIndex, bool accepted)
        external
        returns (bool)
    {
        emit VoteOnNewSmartContract(msg.sender, sCIndex, accepted);
        return state.voteOnNewSC(sCIndex, accepted);
    }

    function closeSmartContractProposal(uint256 sCIndex)
        external
        returns (bool)
    {
        emit CloseSmartContractProposal(msg.sender, sCIndex);
        return state.closeSmartContractProposal(sCIndex);
    }

    function getAcceptedSmartContractIndex() external view returns (uint256) {
        return state.acceptedSCProposalIndex;
    }

    function getAcceptedSCProposalsByIndex(uint256 sCIndex)
        external
        view
        returns (AcceptedSmartContractProposal memory)
    {
        return state.acceptedSCProposals[sCIndex];
    }

    //<-- Smart contract proposal functions end -->

    //<-- Removal proposals start -->
    function proposeContractRemoval(
        string calldata _discussionUrl,
        uint256 _acceptedSCIndex,
        bool malicious
    ) external returns (uint256) {
        emit NewRemovalProposal(
            msg.sender,
            _discussionUrl,
            _acceptedSCIndex,
            malicious
        );
        return
            state.proposeContractRemoval(
                _discussionUrl,
                _acceptedSCIndex,
                malicious
            );
    }

    function votedAlreadyOnRemoval(uint256 removalIndex, address _voter)
        external
        view
        returns (bool)
    {
        return state.votedAlreadyOnRemoval(removalIndex, _voter);
    }

    function voteOnRemoval(uint256 removalIndex, bool accepted)
        external
        returns (bool)
    {
        emit VoteOnRemoval(msg.sender, removalIndex, accepted);
        return state.voteOnRemoval(removalIndex, accepted);
    }

    function closeRemovalProposal(uint256 removalIndex)
        external
        returns (bool)
    {
        emit CloseRemovalProposal(msg.sender, removalIndex);
        return state.closeRemovalProposal(removalIndex);
    }

    function getRemovalProposalIndex() external view returns (uint256) {
        return state.removalProposalIndex;
    }

    function getRemovalProposalByIndex(uint256 index)
        external
        view
        returns (RemovalProposal memory)
    {
        return state.removalProposals[index];
    }

    //<-- removal proposals end -->
}
