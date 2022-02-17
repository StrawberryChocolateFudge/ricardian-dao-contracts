//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/CatalogDaoLib.sol";
import "@ricardianfabric/simpleterms/contracts/SimpleTerms.sol";
import "./DaoStaking.sol";

contract CatalogDao is SimpleTerms {
    using CatalogDaoLib for CatalogState;
    CatalogState private state;

    DaoStaking private daoStaking;

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

    constructor(uint256 pollPeriod, DaoStaking _daoStaking) {
        // The creator of the contract gets elevated privilage and 10 rank points.
        // For other users, max rank is 3, but 10 is needed to pass the voting.
        state.rank[msg.sender] = 10;
        state.pollPeriod = pollPeriod; //302400, Estimate of  how many Harmony blocks are in a week.

        daoStaking = _daoStaking;
        state.owner = msg.sender;
    }

    function setPollPeriod(uint256 pollPeriod) external {
        require(msg.sender == state.owner, "937");
        state.pollPeriod = pollPeriod;
    }

    function getPollPeriod() external view returns (uint256) {
        return state.pollPeriod;
    }

    // <-- Rank functions start -->
    function proposeNewRank(string calldata _repository)
        external
        checkAcceptance
        returns (uint256)
    {
        daoStaking.extendStakeTime(msg.sender);
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
        checkAcceptance
        returns (bool)
    {
        daoStaking.extendStakeTime(msg.sender);
        emit RankVote(msg.sender, rankIndex, accepted);
        return state.voteOnNewRank(rankIndex, accepted);
    }

    function closeRankProposal(uint256 rankIndex) external returns (bool) {
        daoStaking.extendStakeTime(msg.sender);
        emit ClosingRankVote(msg.sender, rankIndex);
        return state.closeRankProposal(rankIndex);
    }

    //<-- Rank functions end -->

    // A getter for fetching all my own proposals
    function getMyProposals() external view returns (MyProposals memory) {
        return state.myProposals[msg.sender];
    }

    function getMyRankProposalsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            RankProposal memory,
            RankProposal memory,
            RankProposal memory,
            RankProposal memory,
            RankProposal memory
        )
    {
        return (
            state.rankProposals[first],
            state.rankProposals[second],
            state.rankProposals[third],
            state.rankProposals[fourth],
            state.rankProposals[fifth]
        );
    }

    function getMySmartContractProposalsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            SmartContractProposal memory,
            SmartContractProposal memory,
            SmartContractProposal memory,
            SmartContractProposal memory,
            SmartContractProposal memory
        )
    {
        return (
            state.smartContractProposals[first],
            state.smartContractProposals[second],
            state.smartContractProposals[third],
            state.smartContractProposals[fourth],
            state.smartContractProposals[fifth]
        );
    }

    function getAcceptedSmartContractProposalsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            AcceptedSmartContractProposal memory,
            AcceptedSmartContractProposal memory,
            AcceptedSmartContractProposal memory,
            AcceptedSmartContractProposal memory,
            AcceptedSmartContractProposal memory
        )
    {
        return (
            state.acceptedSCProposals[first],
            state.acceptedSCProposals[second],
            state.acceptedSCProposals[third],
            state.acceptedSCProposals[fourth],
            state.acceptedSCProposals[fifth]
        );
    }

    function getRemovalProposalsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            RemovalProposal memory,
            RemovalProposal memory,
            RemovalProposal memory,
            RemovalProposal memory,
            RemovalProposal memory
        )
    {
        return (
            state.removalProposals[first],
            state.removalProposals[second],
            state.removalProposals[third],
            state.removalProposals[fourth],
            state.removalProposals[fifth]
        );
    }

    //<-- Smart contract proposal functions start -->

    function proposeNewSmartContract(
        string calldata _arweaveTxId,
        bool _hasFrontEnd,
        bool _hasFees,
        bool isUpdate,
        uint256 updateOf
    ) external checkAcceptance returns (uint256) {
        daoStaking.extendStakeTime(msg.sender);
        emit NewSmartContractProposal(msg.sender, _arweaveTxId);
        return
            state.proposeNewSmartContract(
                _arweaveTxId,
                _hasFrontEnd,
                _hasFees,
                isUpdate,
                updateOf
            );
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

    function voteOnNewSmartContract(
        uint256 sCIndex,
        bool accepted,
        bool suspicious
    ) external checkAcceptance returns (bool) {
        daoStaking.extendStakeTime(msg.sender);
        emit VoteOnNewSmartContract(msg.sender, sCIndex, accepted);
        return state.voteOnNewSC(sCIndex, accepted, suspicious);
    }

    function closeSmartContractProposal(uint256 sCIndex)
        external
        returns (bool)
    {
        daoStaking.extendStakeTime(msg.sender);
        emit CloseSmartContractProposal(msg.sender, sCIndex);
        return state.closeSmartContractProposal(sCIndex);
    }

    function closeSuspiciousProposal(uint256 sCIndex) external {
        state.closeSuspiciousProposal(sCIndex, daoStaking);
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
    ) external checkAcceptance returns (uint256) {
        daoStaking.extendStakeTime(msg.sender);
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
        checkAcceptance
        returns (bool)
    {
        daoStaking.extendStakeTime(msg.sender);
        emit VoteOnRemoval(msg.sender, removalIndex, accepted);
        return state.voteOnRemoval(removalIndex, accepted);
    }

    function closeRemovalProposal(uint256 removalIndex)
        external
        returns (bool)
    {
        daoStaking.extendStakeTime(msg.sender);
        emit CloseRemovalProposal(msg.sender, removalIndex);
        return state.closeRemovalProposal(daoStaking, removalIndex);
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

    function getAllAccepted()
        external
        view
        returns (AcceptedSmartContractProposal[] memory)
    {
        return state.allAccepted;
    }

    function getAllRemoved()
        external
        view
        returns (AcceptedSmartContractProposal[] memory)
    {
        return state.allRemoved;
    }

    function ban(address _address) external {
        require(msg.sender == state.owner, "937");
        daoStaking.penalize(_address);
        state.rank[_address] = 0;
    }

    function retire(address _address_) external {
        require(msg.sender == address(daoStaking), "954");
        state.rank[_address_] = 1;
    }
}
