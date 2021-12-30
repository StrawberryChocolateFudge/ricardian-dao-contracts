//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./DaoStaking.sol";
// The treasury is where the fees accumulate from the contracts in the catalog.
// Token holders can Vote on IERC20 addresses to use for fees.
// Token holders can exchange their tokens for reward from up to 3 IERC20 balances.
// The exchanged tokens are added to the DaoStaking developer reward pool.
struct TokenProposal {
    address creator;
    IERC20 proposal;
    string discussionURL;
    uint256 approvals;
    uint256 rejections;
    uint256 created;
    bool closed;
    bool removal;
    uint256 arrayIndex;
}

uint256 constant requiredBalance = 1000;
uint256 constant precision = 1000000000; //The precision of reward calculation, 9 decimals

contract TreasuryBoard {
    using SafeERC20 for IERC20;

    DaoStaking private staking;
    IERC20 private ric;
    IERC20[] private tokens;
    uint256 private pollPeriod;

    TokenProposal[] private proposals;
    mapping(bytes32 => bool) private voted;

    mapping(address => TokenProposal[]) private myProposals;
    address private owner;

    bool private lock;

    event ProposeNewToken(
        address indexed _address,
        IERC20 _token,
        string _discussionURL,
        bool _removal
    );

    event VoteOnToken(address indexed _address, bool _accepted, uint256 _index);
    event CloseProposal(address indexed _address, uint256 index);
    event WithdrawToken(
        address indexed _address,
        IERC20 withdraw,
        uint256 amount,
        uint256 reward
    );
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

    constructor(
        IERC20 ric_,
        DaoStaking _staking_,
        uint256 pollPeriod_
    ) {
        ric = ric_;
        staking = _staking_;
        pollPeriod = pollPeriod_;
        owner = msg.sender;
    }

    function getTokens() external view returns (IERC20[] memory) {
        return tokens;
    }

    function proposeNewToken(
        IERC20 _token,
        string memory _discussionURL,
        bool _removal
    ) external returns (uint256) {
        require(staking.isStaking(msg.sender), "919");
        // The proposer must have the required balance
        require(ric.balanceOf(msg.sender) > requiredBalance, "932");

        TokenProposal memory proposal = TokenProposal({
            creator: msg.sender,
            proposal: _token,
            discussionURL: _discussionURL,
            approvals: 0,
            rejections: 0,
            created: block.number,
            closed: false,
            removal: _removal,
            arrayIndex: proposals.length
        });

        proposals.push(proposal);

        bytes32 _hash_ = hashTokenProposal(proposal, msg.sender);
        voted[_hash_] = true;
        myProposals[msg.sender].push(proposal);
        emit ProposeNewToken(msg.sender, _token, _discussionURL, _removal);
        return proposals.length;
    }

    function hashTokenProposal(TokenProposal memory _proposal, address _voter)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    _proposal.creator,
                    _proposal.proposal,
                    _proposal.discussionURL,
                    _proposal.created,
                    _voter
                )
            );
    }

    function votedAlready(uint256 index, address _voter)
        public
        view
        returns (bool)
    {
        bytes32 _hash_ = hashTokenProposal(proposals[index], _voter);
        return voted[_hash_];
    }

    function voteOnToken(uint256 index, bool accepted) external {
        require(staking.isStaking(msg.sender), "919");

        // The voter must have the required balance
        require(ric.balanceOf(msg.sender) > requiredBalance, "932");

        bytes32 _hash_ = hashTokenProposal(proposals[index], msg.sender);

        require(!voted[_hash_], "933");

        // check if the voting period is over
        require(proposals[index].created + pollPeriod > block.number, "913");

        if (accepted) {
            proposals[index].approvals += 1;
            // The deployer of the contract can moderate proposals
            if (msg.sender == owner) {
                proposals[index].approvals += 4;
            }
        } else {
            proposals[index].rejections += 1;
            if (msg.sender == owner) {
                proposals[index].rejections += 4;
            }
        }
        voted[_hash_] = true;
        emit VoteOnToken(msg.sender, accepted, index);
    }

    function closeTokenProposal(uint256 index) external {
        // Everybody closes their own proposals
        require(proposals[index].creator == msg.sender, "914");
        // The poll period must be over
        require(proposals[index].created + pollPeriod < block.number, "915");
        require(proposals[index].closed, "917");

        proposals[index].closed = true;
        // If there are more approvals than rejections
        if (proposals[index].approvals > proposals[index].rejections) {
            if (proposals[index].removal) {
                delete tokens[proposals[index].arrayIndex];
            } else {
                tokens.push(proposals[index].proposal);
            }
        }
        // else its closed, done.
        emit CloseProposal(msg.sender, index);
    }

    function getProposals() external view returns (TokenProposal[] memory) {
        return proposals;
    }

    function calculateWithdraw(IERC20 from, uint256 amount)
        public
        view
        returns (uint256 payment)
    {
        // How much is the amount compared to the total supply?
        uint256 withPadding = amount * precision;
        uint256 dividedByTotal = (withPadding / ric.totalSupply());

        uint256 calculatedValue = dividedByTotal *
            from.balanceOf(address(this));
        payment = calculatedValue / precision;
    }

    function withdraw(IERC20 from, uint256 amount) external {
        require(ric.balanceOf(msg.sender) > amount, "934");
        uint256 _reward = calculateWithdraw(from, amount);
        require(_reward < from.balanceOf(address(this)), "927");
        require(!lock, "935");
        lock = true;
        // Return the same percentage of tokens to the sender
        // and transfer the amount to the developer reward
        // Deposit the RIC to the staking
        staking.depositRewards(amount);

        // and transfer him the requirested tokens
        from.safeTransfer(msg.sender, _reward);

        lock = false;
        emit WithdrawToken(msg.sender, from, amount, _reward);
    }

    function withdraw(
        IERC20 first,
        IERC20 second,
        IERC20 third,
        uint256 amount
    ) external {
        require(proposals.length >= 3, "936");
        require(ric.balanceOf(msg.sender) > amount, "934");
        uint256 firstReward = calculateWithdraw(first, amount);
        require(firstReward < first.balanceOf(address(this)), "927");
        uint256 secondReward = calculateWithdraw(second, amount);
        require(secondReward < second.balanceOf(address(this)), "927");
        uint256 thirdReward = calculateWithdraw(third, amount);
        require(thirdReward < third.balanceOf(address(this)), "927");
        require(!lock, "935");
        lock = true;
        // Deposit the RIC to the staking
        staking.depositRewards(amount);

        // and transfer him the requested tokens
        first.safeTransfer(msg.sender, firstReward);
        second.safeTransfer(msg.sender, secondReward);
        third.safeTransfer(msg.sender, thirdReward);
        emit WithdrawThreeTokens(
            msg.sender,
            first,
            second,
            third,
            amount,
            firstReward,
            secondReward,
            thirdReward
        );
        lock = false;
    }
}
