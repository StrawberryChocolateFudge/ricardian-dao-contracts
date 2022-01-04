//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CatalogDao.sol";
import "./ArweavePS.sol";
import "./libraries/CatalogDaoLib.sol";

// DAO staking is for sybil resistance.
// All addresses asking for Rank must be staking to avoid rank request spam.
// Dao staking also pays out Ric for accepted smart contract proposals.
// The user must stake 30 tokens

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

    mapping(address => bool) private stakers;
    mapping(address => uint256) private stakeDate;
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
        if (stakers[_address_]) {
            return stakeDate[_address_];
        } else {
            return 0;
        }
    }

    function setCatalogDao(CatalogDao _address) external onlyOwner {
        catalogDao = _address;
    }

    function stake() external {
        // check if the address is staking already.
        require(!stakers[msg.sender], "922");

        // check if the sender has enough balance
        require(_token.balanceOf(msg.sender) > STAKINGREQUIREMENT, "923");
        // record the transfer
        stakers[msg.sender] = true;
        stakeDate[msg.sender] = block.number;
        // Transfer to this smart contract
        _token.safeTransferFrom(msg.sender, address(this), STAKINGREQUIREMENT);
        totalStaked += STAKINGREQUIREMENT;
        emit Stake(msg.sender, totalStaked);
    }

    function isStaking(address _address) external view returns (bool) {
        return stakers[_address];
    }

    function unStake() external {
        require(stakers[msg.sender], "919");
        require(stakeDate[msg.sender] + stakingBlocks < block.number, "924");
        stakers[msg.sender] = false;

        _token.safeTransfer(msg.sender, STAKINGREQUIREMENT);
        totalStaked -= STAKINGREQUIREMENT;

        arweavePS.stoppedStaking(msg.sender);
        emit Unstake(msg.sender, totalStaked);
    }

    function extendStakeTime(address forAddress) external {
        require(msg.sender == address(catalogDao), "925");
        require(stakers[forAddress], "926");
        stakeDate[forAddress] += block.number;
        emit ExtendStakeTime(forAddress, stakeDate[forAddress]);
    }

    function penalize(address address_) external {
        require(msg.sender == address(catalogDao), "925");
        // The staker lost his balance, the catalogDao decides!
        stakers[address_] = false;
        totalStaked -= STAKINGREQUIREMENT;
        // It's added to the reward
        availableReward += STAKINGREQUIREMENT;
        arweavePS.stoppedStaking(address_);
        emit Penalize(address_);
        emit Unstake(msg.sender, totalStaked);
    }

    function depositRewards(uint256 amount) external {
        //the rewards that can be pulled, are added this way
        _token.safeTransferFrom(msg.sender, address(this), amount);
        availableReward = amount;
        emit RewardDeposit(msg.sender, amount, availableReward);
    }

    function claimReward(uint256 forProposal) external {
        //If you are staking, you can claim rewards for accepted smart contracts
        require(lock == 0, "935");
        lock = 1;
        require(stakers[msg.sender], "919");

        // Use the catalogDAO to get the rank of the user
        uint8 rank = catalogDao.getRank(msg.sender);
        require(rank > 0, "929");

        AcceptedSmartContractProposal memory proposal = catalogDao
            .getAcceptedSCProposalsByIndex(forProposal);

        uint256 reward = getActualReward(
            proposal.hasFrontend,
            proposal.hasFees
        );

        require(availableReward > reward, "927");
        require(proposal.creator == msg.sender, "930");

        // Here I check if this proposal has been rewarded already.
        require(!rewardedProposals[proposal.arweaveTxId], "931");

        rewardedProposals[proposal.arweaveTxId] = true;

        //and transfer the reward

        availableReward -= reward;

        _token.safeTransfer(msg.sender, reward);
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
}
