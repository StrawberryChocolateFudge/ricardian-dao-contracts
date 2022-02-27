# FeeDao

The feeDao is a smart contract where the rewards from contracts accepted into the catalog can accumulate.
The contributors are bound by a ricardian contract to transfer fees here.

Ric holders are able to propose and vote on ERC20 token addresses to use for fees.
1000 Ric is required to create a proposal and the addresses who propose or vote must be staking and have rank.

Ric holders are able to take out the rewards based on how much tokens they hold compared to the total supply.
In-order to take the fee rewards, they need to lock up their tokens in the Ric Vault for a period.

## Constructor

    constructor(
        IERC20 ric_,
        DaoStaking _staking_,
        CatalogDao _catalogDao_,
        uint256 pollPeriod_
    );

The deployer will pass the addresses of the token, the daoStaking and the catalogDao contracts, and the poll period, the amount of blocks that need to pass before a proposal can be closed.

## External functions

    function setRicVault(RicVault _ricVault_) external;

The owner sets the RicVault location after deployment separately.

    function setPollPeriods(
        uint256 singleLock,
        uint256 trippleLock,
        uint256 pollPeriod
    ) external;

The poll period and the ric vault lock up times can be set by the owner separately.
This is important in case Harmony reaches 1 second finality, as the block times are calculated with a 2 second finality.

    function proposeNewToken(
    	IERC20 _token,
    	string memory _discussionURL,
    	string memory _name_
    ) external returns (uint256);

A new token can be proposed by a dao member who is staking and has rank. He also needs a minimum balance of 1000 Ric to create the proposal.
An address can only create 1 proposal at a time.

    function voteOnToken(uint256 index, bool accepted) external;

A dao member who is staking and has rank can vote on the token.
The proposals are stored indexed, so the index represents the token to vote for,
accepted is true if the proposal is approved.

    function closeTokenProposal(uint256 index) external;

A proposing address can close his own proposal.
He needs to have rank to close it.

    function expressOpinion(uint256 _tokenArrIndex_, bool likedIt) external;

Anyone can express their opinion on a token, accessed with it's index.
likedIt is true for a thumbs up.

    function withdrawETH(uint256 amount) external;

Allows an address to exchange his Ric for ETH stored in the contract.
The Ric is locked up in the Ric vault for a single lock period.
Addresses must grant Ric allowance to the RicVault to call this function

    receive() external payable;

The receive function tracks the Eth transfered to this contract so it can distribute it later as rewards.

    function withdrawOne(IERC20 from, uint256 amount) external;

The user can withdraw from a single ERC20..
The ERC20 passed in must be from a list, accepted via voting.
The amount is the Ric transfered.
Addresses must grant Ric allowance to the RicVault to call this function.

## View functions

    function getProposals() external view returns (TokenProposal[] memory);

Returns all the proposals.

    function votedAlready(uint256 index, address _voter)
    	public
    	view
    	returns (bool);

Check if an address voted already, pass in the index of the proposal and the address of the voter. The proposals are stored in an Array, too high index will result in an array overflow error.

    function getTokens() external view returns (Token[] memory);

Returns an array of Token objects, that represent the tokens that have been voted in.

    function calculateETHWithdraw(uint256 amount)
    	public
    	view
    	returns (uint256 payment);

Calculates the amount of ETH received from the contract in exchange for Ric.

    function calculateWithdraw(IERC20 from, uint256 amount)
        public
        view
        returns (uint256 payment);

Calculates the amount of ERC20 rewards transfered to the user in exchange for amount of Ric.

    function getCurrentBalance() external view returns (uint256);

Returns the current balance of the contract. (ETH)

    function getTotalBalance() external view returns (uint256);

Returns the total balance passing thorugh the contract. (ETH)

    function viewSpentBalanceOf(IERC20 _token_)
    	external
    	view
    	returns (uint256);

Returns the amount of tokens spent by the contract. This is used to get the amount that was payed out per ERC20.

Objects:

    struct TokenProposal {
    	address creator;
    	string name;  // The name of the token
    	IERC20 proposal;  // The token that is proposed
    	string discussionURL; // The link to the discussion about the proposal
    	uint256 approvals;
    	uint256 rejections;
    	uint256 created;
    	bool closed;
    }

    struct Token {
    	string name; // The name of the token
    	IERC20 token;
    	uint256 likes; // Amount of addresses liking this
    	uint256 dislikes; // Amount of addresses disliking this
    }

## Events

    event ProposeNewToken(
        address indexed _address,
        IERC20 _token,
        string _discussionURL
    );

Emitted when a new token is proposed for collecting fees in.

    event VoteOnToken(address indexed _address, bool _accepted, uint256 _index);

Emitted when a member votes on a token

    event CloseProposal(address indexed _address, uint256 index);

Emitted when a proposal is closed

    event WithdrawToken(
        address indexed _address,
        IERC20 withdraw,
        uint256 amount,
        uint256 reward
    );

Emitted when tokens are withdrawn

    event WithdrawThreeTokens(
        address indexed _address,
        IERC20 first,
        IERC20 second,
        IERC20 third,
        uint256 amount,
        uint256 firstReward,
        uint256 secondReward,
        uint256 thirdReward
    );

Emitted when 3 tokens are withdrawn.

    event Received(address to, uint256 value);

Emitted when ETH was deposited successfully

    event WithdrawEth(address to, uint256 reward, uint256 ricAmount);

Emitted when ETH is withdrawd for Ric successfully
