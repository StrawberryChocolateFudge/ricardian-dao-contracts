//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CatalogDao.sol";
import "./ArweavePS.sol";
import "./libraries/CatalogDaoLib.sol";

// Staking is for sybil resistance.
// All addresses asking for Rank must be staking to avoid rank request spam.
// Dao staking also pays out Ric for accepted smart contract proposals.
// The user must stake 30 tokens

struct Staker {
    bool isStaking;
    uint256 stakeDate;
    uint256 stakeAmount;
}

contract DaoStaking is Ownable {
    using SafeERC20 for IERC20;
    IERC20 private _token; // The Ric token

    uint256 private constant STAKINGREQUIREMENT = 30e18; // Required tokens to stake.
    uint256 private constant MAXREWARD = 1000e18; // Reward payed out to accepted proposal creators!
    uint256 private constant FEATUREREWARD = 300e18;

    CatalogDao private catalogDao;
    ArweavePS private arweavePS;
    uint256 private totalStaked;
    uint256 private availableReward;

    uint256 private stakingBlocks; // The blocks that need to pass before the staking can be removed.

    // mapping(address => bool) private stakers;
    // mapping(address => uint256) private stakeDate;
    mapping(address => Staker) private stakers;
    address[] public allStakers;
    mapping(string => bool) private rewardedProposals;

    uint8 private lock = 0;

    event Stake(address indexed _address, uint256 totalStaked);
    event Unstake(address indexed _address, uint256 totalStaked);
    event ExtendStakeTime(address indexed _address, uint256 stakeDate);
    event Penalize(address indexed _address);
    event RewardDeposit(
        address indexed _address,
        uint256 amount,
        uint256 availableReward
    );
    event ClaimReward(
        address indexed _address,
        uint256 forProposal,
        uint256 availableReward
    );

    constructor(
        IERC20 _token_,
        ArweavePS _ps_,
        uint256 _stakingBlocks_
    ) {
        _token = IERC20(_token_);
        totalStaked = 0;
        arweavePS = _ps_;
        stakingBlocks = _stakingBlocks_;
    }

    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }

    function getAvailableReward() external view returns (uint256) {
        return availableReward;
    }

    function getDetails()
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (STAKINGREQUIREMENT, stakingBlocks, MAXREWARD);
    }

    function getStakeDateFor(address _address_)
        external
        view
        returns (uint256)
    {
        if (stakers[_address_].isStaking) {
            return stakers[_address_].stakeDate;
        } else {
            return 0;
        }
    }

    function setCatalogDao(CatalogDao _address) external onlyOwner {
        catalogDao = _address;
    }

    function setStakingBlocks(uint256 to) external onlyOwner {
        stakingBlocks = to;
    }

    function stake() external {
        require(lock == 0, "935");
        lock = 1;
        // check if the address is staking already.
        require(!stakers[msg.sender].isStaking, "922");

        // check if the sender has enough balance
        require(_token.balanceOf(msg.sender) >= STAKINGREQUIREMENT, "923");
        // record the transfer
        stakers[msg.sender] = Staker({
            isStaking: true,
            stakeDate: block.number,
            stakeAmount: STAKINGREQUIREMENT
        });
        allStakers.push(msg.sender);
        totalStaked += STAKINGREQUIREMENT;
        // Transfer to this smart contract
        _token.safeTransferFrom(msg.sender, address(this), STAKINGREQUIREMENT);
        emit Stake(msg.sender, totalStaked);
        lock = 0;
    }

    function isStaking(address _address) external view returns (bool) {
        return stakers[_address].isStaking;
    }

    function unStake() external {
        require(lock == 0, "935");
        lock = 1;
        require(stakers[msg.sender].isStaking, "919");
        require(
            stakers[msg.sender].stakeDate + stakingBlocks < block.number,
            "924"
        );
        stakers[msg.sender].isStaking = false;
        totalStaked -= stakers[msg.sender].stakeAmount;
        arweavePS.stoppedStaking(msg.sender);
        catalogDao.retire(msg.sender);
        _token.safeTransfer(msg.sender, stakers[msg.sender].stakeAmount);
        emit Unstake(msg.sender, totalStaked);
        lock = 0;
    }

    function extendStakeTime(address forAddress) external {
        require(msg.sender == address(catalogDao), "925");
        require(stakers[forAddress].isStaking, "926");
        // Assigns the block number only!
        stakers[forAddress].stakeDate = block.number;
        emit ExtendStakeTime(forAddress, stakers[forAddress].stakeAmount);
    }

    function penalize(address address_) external {
        require(msg.sender == address(catalogDao), "925");
        // The staker lost his balance, the catalogDao decides!
        stakers[address_].isStaking = false;
        totalStaked -= stakers[address_].stakeAmount;
        // It's added to the reward
        availableReward += stakers[address_].stakeAmount;
        stakers[address_].stakeAmount = 0;
        arweavePS.stoppedStaking(address_);
        emit Penalize(address_);
        emit Unstake(msg.sender, totalStaked);
    }

    function depositRewards(uint256 amount) external {
        require(lock == 0, "935");
        lock = 1;
        //the rewards that can be pulled, are added this way
        availableReward += amount;
        _token.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardDeposit(msg.sender, amount, availableReward);
        lock = 0;
    }

    function claimReward(uint256 forProposal) external {
        //If you are staking, you can claim rewards for accepted smart contracts
        require(lock == 0, "935");
        lock = 1;
        require(stakers[msg.sender].isStaking, "919");

        // Use the catalogDAO to get the rank of the user
        uint8 rank = catalogDao.getRank(msg.sender);
        require(rank > 0, "929");

        AcceptedSmartContractProposal memory proposal = catalogDao
            .getAcceptedSCProposalsByIndex(forProposal);
        require(!proposal.isUpdate, "953");
        uint256 reward = getActualReward(
            proposal.hasFrontend,
            proposal.hasFees
        );

        require(availableReward > reward, "927");
        require(proposal.creator == msg.sender, "930");

        // Here I check if this proposal has been rewarded already.
        require(!rewardedProposals[proposal.arweaveTxId], "931");

        rewardedProposals[proposal.arweaveTxId] = true;
        availableReward -= reward;

        uint256 rewardHalf = reward / 2;
        totalStaked += rewardHalf;
        stakers[msg.sender].stakeAmount += rewardHalf;

        //and transfer the reward
        _token.safeTransfer(msg.sender, rewardHalf);

        emit ClaimReward(msg.sender, forProposal, availableReward);
        lock = 0;
    }

    function getActualReward(bool hasFrontend, bool hasFees)
        public
        pure
        returns (uint256)
    {
        if (hasFrontend && hasFees) {
            return MAXREWARD;
        } else if (hasFees) {
            return FEATUREREWARD + FEATUREREWARD;
        } else if (hasFrontend) {
            return FEATUREREWARD + FEATUREREWARD;
        } else {
            return FEATUREREWARD;
        }
    }

    function getStaker(address _address_)
        external
        view
        returns (Staker memory)
    {
        return stakers[_address_];
    }

    function getStakingBlocks() external view returns (uint256) {
        return stakingBlocks;
    }
}
