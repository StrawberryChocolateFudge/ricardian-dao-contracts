# CatalogDao

This contract is used for voting on the smart contracts in the catalog.
It works with Rank. Users need to propose to get rank before they can vote or can propose new smart contracts.

To propose a smart contract, the contents of the contract are uploaded to arweave and the DAO votes on the transaction Id.

## External functions

    function proposeNewRank(string calldata _repository)
        external
        returns (uint256);

Propose to get rank by calling this function. Pass in the url of your github repo.

    function voteOnNewRank(uint256 rankIndex, bool accepted)
        external
        returns (bool);

Vote on a proposal found at `rankIndex`. `accepted` is true in case of approving and false in case of rejection
Calling this function will extend the stake time of the address.

    function closeRankProposal(uint256 rankIndex) external returns (bool);

The creator of the proposal needs to close it.

    function proposeNewSmartContract(string calldata _arweaveTxId,  bool _hasFrontEnd,
        bool _hasFees)
        external
        returns (uint256);

Propose a new smartcontract by passing in the arweave transaction's id, if it has fees or front end, claiming higher reward later.
Calling this function will extend the stake time of the address.

    function voteOnNewSmartContract(uint256 sCIndex, bool accepted,bool suspicious)
        external
        returns (bool);

Vote on the new smart contract found at `sCIndex`, "smart contract index". If accepted is true then the proposal is approved.
Suspicious is used together with accepted = false, if enough members vote that the proposal is malicious, the creator will loose his stake and get kicked out.
Calling this function will extend the stake time of the address.

    function closeSmartContractProposal(uint256 sCIndex)
        external
        returns (bool);

Close your smart contract proposal.

    function closeSuspiciousProposal(uint256 sCIndex) external;

If a proposal is suspicious, anyone can close it to penalize the malicious actor.

    function proposeContractRemoval(
        string calldata _discussionUrl,
        uint256 _acceptedSCIndex,
        bool malicious
    ) external returns (uint256);

You can propose the removal of a smart contract, `_discussionUrl` is where the related discussion takes place. The `_acceptedSCIndex` is the index of the accepted smart contract that is proposed for removal.

`malicious` is true if a contract was malicious. It can only be used by rank 2 user.
because this will be used to ban the offender by reducing his rank to 0 and taking his stake.

if the contract is not malicious, a user can only remove his own contracts.

    function voteOnRemoval(uint256 removalIndex, bool accepted)
        external
        returns (bool);

You can vote on the removal proposal using the proposal index and your vote.ZP

    function closeRemovalProposal(uint256 removalIndex)
        external
        returns (bool);

Removal proposals are closed by their creators.

    function expressOpinion(uint256 _index_, bool likedIt)
    	external
    	returns (AcceptedSmartContractProposal memory);

A wallet can express his opinion about an accepted smart contract

## View funcitons

    function getRank(address _address) public view returns (uint8);

Fetch the rank of an address. Rank determines vote weight and it's between 0 - 3, Only deployer of the catalogDao has rank 10, because 10 rank is required to pass a proposal.

    function getRankProposalIndex() external view returns (uint256);

The proposals are stored indexed, You can fetch the last index which is incremented with each proposal.

    function getRankProposalsByIndex(uint256 index)
        external
        view
        returns (RankProposal memory);

Returns the rank proposals at an index, used with getRankProposalIndex.
First you get the current index, then you can fetch all proposals by iterating from 1 till the last index while calling this function.

    struct RankProposal {
        string repository; //The repository url submitted  for inspection and commenting.
        address creator; // the address of the proposal creator
        uint256 createdBlock; // The block number when it was created[]
        uint256 approvals; // The amount of approvals, the sum of the rank of the voters.
        uint256 rejections; // The amount of rejections, the sum of the rank of the voters
        bool closed; //voting closed
    }

The rank proposal object contains information about the proposal.

    votedAlreadyOnRank(uint256 rankIndex, address _voter)
        external
        view returns (bool);

A helper function to determine if an address voted already on a rank proposal.

    function getSmartContractProposalIndex() external view returns (uint256);

Returns a smart contract proposal's last index. For example, if 10 smart contracts were proposed, the number is 10.

    function getSmartContractProposalsByIndex(uint256 index)
        external
        view
        returns (SmartContractProposal memory);

You can get all the smart contract proposals using the index.

    struct SmartContractProposal {
        string arweaveTxId; //The contents of the proposal is stored on arweave
        address creator; // The creator address
        uint256 createdBlock; // The block when it was created
        uint256 approvals; //Approval votes
        uint256 rejections; // rejection votes
        bool closed; // did the proposal get closed already
    }

The smart contract proposal object.

    function votedAlreadyOnSmartContract(uint256 sCIndex, address _voter)
        external
        view
        returns (bool);

Determine if an address `_voter` already voted on proposal index `sCIndex`

    function getAcceptedSmartContractIndex() external view returns (uint256);

Returns the last index of the accepted smart contracts. These contracts are shown in the catalog.

    function getAcceptedSCProposalsByIndex(uint256 sCIndex)
        external
        view
        returns (AcceptedSmartContractProposal memory);

You can fetch the accepted smart contract proposals by index.

    struct AcceptedSmartContractProposal {
        string arweaveTxId;
        address creator;
        bool removed;
    }

The accepted smart contract proposal object.

    function votedAlreadyOnRemoval(uint256 removalIndex, address _voter)
        external
        view returns (bool);

You can check if the address `_voter` already voted on the removal of contract at `removalIndex`;

    function getRemovalProposalIndex() external view returns (uint256);

Get the last index of the removal proposal

    function getRemovalProposalByIndex(uint256 index)
        external
        view
        returns (RemovalProposal memory);

Get the RemovalProposal using the index;

    struct RemovalProposal {
        string discussionUrl;  // The url of the discussion about the removal
        address creator; // The creator of the proposal
        bool malicious; // Is the removed contract malicious?
        uint256 acceptedIndex; // The index from acceptedSCProposals
        uint256 createdBlock; // The block when the contract was created
        uint256 approvals; // The apporvals vote weigth
        uint256 rejections; // The rejections vote weigth
        bool closed; // Did the proposal close already
    }

The removal proposal object.

    getMyProposals() external view returns (MyProposals memory);

Returns all the proposals created by the user.

    struct MyProposals {
        uint256[] rank;
        uint256[] smartContract;
        uint256[] acceptedSCProposals;
        uint256[] removedFromMe;
        uint256[] removal;
    }

The object returned contains arrays of proposal Indexes.

    uint256[] rank; // The index of the rank proposal

    uint256[] smartContract; // The indexs of all the proposed smart contracts

    uint256[] acceptedSCProposals; // The indexes of all the accepted smart contract proposals

    uint256[] removedFromMe; // The list of smart contracts removed from the address;

    uint256[] removal; //The list of removal proposals, created bu this address.

Used for getting 5 rank proposals

     function getMyRankProposalsPaginated(
          uint256 first,
          uint256 second,
          uint256 third,
          uint256 fourth,
          uint256 fifth
     )external
        view
        returns (
            RankProposal memory,
            RankProposal memory,
            RankProposal memory,
            RankProposal memory,
            RankProposal memory
        );

Used for getting 5 smart contract proposals

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
    	);

Used for getting 5 accepted smart contracts

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

Used for getting all the accepted contracts

    function getAllAccepted()
    	external
    	view
    	returns (AcceptedSmartContractProposal[] memory);

Used for getting all the removed contracts

    function getAllRemoved()
        external
        view
    returns (AcceptedSmartContractProposal[] memory);

## Events

    event NewRankProposal(address indexed from, string repository)

Triggered when a new rank is proposed.

    event RankVote(address indexed from, uint256 rankIndex, bool accepted);

A voting on the rank will emit this event

    event ClosingRankVote(address indexed from, uint256 rankIndex);

This event is emitted when a ranking vote is closed.

    event NewSmartContractProposal(address indexed from, string arweaveTxId;

The event is triggered on new smart contract proposal. The arweaveTxId represents the transaction of the proposal.

    event VoteOnNewSmartContract(
        address indexed from,
        uint256 index,
        bool accepted
    );

This is triggered when voting on a new smart contract

    event CloseSmartContractProposal(address indexed from, uint256 index);

Triggered when closing a smart contract proposal

    event NewRemovalProposal(
        address indexed from,
        string discussionUrl,
        uint256 accetedIndex,
        bool malicious
    );

This is emitted when a smart contract proposal was accepted but somebody wants it removed.

    event VoteOnRemoval(address indexed from, uint256 index, bool accepted);

Emitted when a voting occurs on the removal proposal

    event CloseRemovalProposal(address indexed from, uint256 index);

Emitted when a removal proposal is closed.
