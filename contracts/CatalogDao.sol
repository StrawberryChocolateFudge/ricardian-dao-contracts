//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./libraries/CatalogDaoLib.sol";

contract CatalogDao {
    using CatalogDaoLib for CatalogState;
    CatalogState private state;

    // <-- Rank functions start -->
    function proposeNewRank(string calldata _repository)
        external
        returns (uint256)
    {
        return state.proposeNewRank(_repository);
    }

    function getRank(address _address) public view returns (uint256) {
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
        return state.voteOnNewRank(rankIndex, accepted);
    }

    function closeRankProposal(uint256 rankIndex) external returns (bool) {
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
        return state.voteOnNewSC(sCIndex, accepted);
    }

    function closeSmartContractProposal(uint256 sCIndex)
        external
        returns (bool)
    {
        return state.closeRankProposal(sCIndex);
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
}
