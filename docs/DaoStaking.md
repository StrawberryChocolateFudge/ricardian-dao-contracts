# DaoStaking

All users need to stake 30 RIC before they can contribute to the DAO.

This is used to secure the catalog. Staking is for sybil resistance and serves as a disincentive for submitting malicious proposals.

After successful contribution, the claimReward function can be called to claim the Ric reward the contributor is entitled to.
50% of this reward is transfered to his address instantly and the rest is added to the stake.

Higher than 1 ranks will have high stake in the system so they will not propose malicious smart contracts.

When a contributor decides to unstake, he can do after the stake time expires. He will receive the reward and his rank is dropped to 0.

In order to contribute again, users need to submit a new rank proposal to the dao.

## API

### Constructor

    constructor(
    	IERC20 _token_,
    	ArweavePS _ps_,
    	uint256 _stakingBlocks_
    );

On deployment, the Ric token's address, the ArweavePS contract's address and the amount of blocks that need to pass, before unstaking, is passed in!

### External functions

    function setCatalogDao(CatalogDao _address) external onlyOwner;

The owner can set the address of the catalogDao, it's called just after deployment.

    function setStakingBlocks(uint256 to) external onlyOwner

The deployer can set the stakingblocks to a new value.
(The deployer will call this after Harmony reaches 1 second finality to adjust unstake time)

    function stake() external;

An address that would like to contribute to the catalog has to call this.
The sender must **grant allowance to the daoStaking contract**.
The staking requirement is 30 Ric.

    function unStake() external;

The staker can claim his Ric stake and exit the dao.
This will reduce the rank to 0 and cancels Arweave rewards.

    function extendStakeTime(address forAddress) external;

Callable only by the catalogDAO. The stake time is extended on voting or when creating proposals. This is used because the staker must not unstake after a proposal.

    function penalize(address address_) external;

This function can be called only by the catalogDAO.
A malicious user can be penalized, he can loose his stake. This is decided during voting

    function depositRewards(uint256 amount) external;

In order to have rewards to claim, the deployer will deposit rewards using this function. Anybody can deposit Ric to support later.

    function claimReward(uint256 forProposal) external;

Contributors can claim a reward for an accepted proposal.
50% is added to the stake and 50% is payed out instantly.
Rewards are from 300 - 1000 Ric.

### View functions

    function getStakingBlocks() external view returns (uint256);

Returns the amount of blocks that need to pass for the staking rewards to become available.

    function getStaker(address _address_)
    	external
    	view
    	returns (Staker memory);

Returns the staker object that is created on staking.

    struct Staker {
    	bool isStaking;
    	uint256 stakeDate;
    	uint256 stakeAmount;
    }

isStaking is used for require checks in other contracts,
stakeDate is the block.number during a call to stake() or extendStakeTime(),
stakeAmount is the current Ric balance in stake.

    function getActualReward(bool hasFrontend, bool hasFees)
    	public
    	pure
    	returns (uint256);

This function will return he reward if the proposal has a front end or fees.

    function isStaking(address _address) external view returns (bool);

Check if an address is staking without fetching the Staker object.

    function getStakeDateFor(address _address_)
    	external
    	view
    	returns (uint256)

Returns the stakeDate for an address

    function getTotalStaked() external view returns (uint256);

Returns the total staked amount of RIC. This is the amount that is securing the catalog.

    function getAvailableReward() external view returns (uint256);

The available reward is the amount that can be claimed by contributors to the catalog.

    function getDetails()
    	external
    	view
    	returns (
    	    uint256,
    	    uint256,
    	    uint256
    	);

Returns the inner details of the contract, the STAKINGREQUIREMENT , the stakingBlocks, used for the stake time before unstaking and the MAXREWARD

### Events

    event Stake(address indexed _address, uint256 totalStaked);

Emitted when staking.

    event Unstake(address indexed _address, uint256 totalStaked);

Emitted when Unstaking and during Penalize

    event ExtendStakeTime(address indexed _address, uint256 stakeDate);

Emitted when a stake time is extended.

    event Penalize(address indexed _address);

emitted on Penalize called.

    event RewardDeposit(
    	address indexed _address,
    	uint256 amount,
    	uint256 availableReward
    );

Emitted when a reward is deposited

    event ClaimReward(
    	address indexed _address,
    	uint256 forProposal,
    	uint256 availableReward
    );

emitted when a reward is claimed.
