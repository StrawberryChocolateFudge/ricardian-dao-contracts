//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./DaoStaking.sol";
import "./RicVault.sol";

// The FeeDao is where the fees accumulate from the contracts in the catalog.
// Token holders can Vote on IERC20 addresses to use for fees.
// Token holders can exchange their tokens for reward from up to 3 IERC20 balances.
// The exchanged tokens are added to the DaoStaking developer reward pool.
struct TokenProposal {
    address creator;
    string name;
    IERC20 proposal;
    string discussionURL;
    uint256 approvals;
    uint256 rejections;
    uint256 created;
    bool closed;
}

struct Token {
    string name; // The name of the token
    IERC20 token;
}

uint256 constant requiredBalance = 10000e18;
uint256 constant precision = 1000000000; //The precision of reward calculation, 9 decimals

enum Balance {
    current,
    total
}
enum Periods {
    singleLock,
    trippleLock,
    pollPeriod
}

contract FeeDao {
    using SafeERC20 for IERC20;

    DaoStaking private staking;
    CatalogDao private catalogDao;
    RicVault private ricVault;
    IERC20 private ric;

    TokenProposal[] private proposals;
    mapping(bytes32 => bool) private voted;

    mapping(address => TokenProposal[]) private myProposals;
    mapping(address => bool) private hasPendingProposal;

    Token[] private tokens;
    // addressAdded is used like a .contains array method for the tokens .
    // will return true if the address has been added
    mapping(address => bool) private addressAdded;

    mapping(bytes32 => uint256) private balance;

    mapping(Periods => uint256) private periods;

    address private owner;

    bool private lock;

    event ProposeNewToken(
        address indexed _address,
        IERC20 _token,
        string _discussionURL
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

    event Received(address to, uint256 value);
    event WithdrawEth(address to, uint256 reward, uint256 ricAmount);

    constructor(
        IERC20 ric_,
        DaoStaking _staking_,
        CatalogDao _catalogDao_,
        uint256 pollPeriod_
    ) {
        ric = ric_;
        staking = _staking_;
        periods[Periods.pollPeriod] = pollPeriod_;
        periods[Periods.singleLock] = 1314900; //blocks are around 1 month with 2 second finality
        periods[Periods.trippleLock] = 3944700; // blocks are around 3 months with a 2 second finality
        owner = msg.sender;
        catalogDao = _catalogDao_;
        balance[hashBalance(Balance.current)] = 0;
        balance[hashBalance(Balance.total)] = 0;
    }

    function setRicVault(RicVault _ricVault_) external {
        require(msg.sender == owner, "937");
        ricVault = _ricVault_;
    }

    function setPollPeriods(
        uint256 singleLock,
        uint256 trippleLock,
        uint256 pollPeriod
    ) external {
        require(msg.sender == owner, "937");

        periods[Periods.singleLock] = singleLock;
        periods[Periods.trippleLock] = trippleLock;
        periods[Periods.pollPeriod] = pollPeriod;
    }

    function proposeNewToken(
        IERC20 _token,
        string memory _discussionURL,
        string memory _name_
    ) external returns (uint256) {
        require(address(_token) != address(0), "948");
        require(staking.isStaking(msg.sender), "919");
        require(catalogDao.getRank(msg.sender) > 0, "911");
        // The proposer must have the required balance
        require(ric.balanceOf(msg.sender) > requiredBalance, "932");
        require(!hasPendingProposal[msg.sender], "944");
        TokenProposal memory proposal = TokenProposal({
            name: _name_,
            creator: msg.sender,
            proposal: _token,
            discussionURL: _discussionURL,
            approvals: 0,
            rejections: 0,
            created: block.number,
            closed: false
        });
        hasPendingProposal[msg.sender] = true;
        proposals.push(proposal);
        bytes32 _hash_ = hashTokenProposal(proposal, msg.sender);
        voted[_hash_] = true;
        myProposals[msg.sender].push(proposal);
        emit ProposeNewToken(msg.sender, _token, _discussionURL);
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

    // Accessing array by index here!
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
        require(catalogDao.getRank(msg.sender) > 0, "911");
        // The voter must have the required balance
        require(ric.balanceOf(msg.sender) > requiredBalance, "932");

        bytes32 _hash_ = hashTokenProposal(proposals[index], msg.sender);

        require(!voted[_hash_], "933");

        // check if the voting period is over
        require(
            proposals[index].created + periods[Periods.pollPeriod] >
                block.number,
            "913"
        );

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
        require(catalogDao.getRank(msg.sender) > 0, "911");

        // Everybody closes their own proposals
        require(proposals[index].creator == msg.sender, "914");
        // The poll period must be over
        require(
            proposals[index].created + periods[Periods.pollPeriod] <
                block.number,
            "915"
        );
        require(!proposals[index].closed, "917");

        proposals[index].closed = true;
        hasPendingProposal[msg.sender] = false;
        // If there are more approvals than rejections
        if (proposals[index].approvals > proposals[index].rejections) {
            tokens.push(
                Token({
                    name: proposals[index].name,
                    token: proposals[index].proposal
                })
            );
            addressAdded[address(proposals[index].proposal)] = true;
        }
        // else its closed, done.
        emit CloseProposal(msg.sender, index);
    }

    function tokenHashWithAddress(Token memory _tokens_)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(_tokens_.name, _tokens_.token, msg.sender)
            );
    }

    function getTokens() external view returns (Token[] memory) {
        return tokens;
    }

    function getProposals() external view returns (TokenProposal[] memory) {
        return proposals;
    }

    function getMyProposals() external view returns (TokenProposal[] memory) {
        return myProposals[msg.sender];
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

    function calculateETHWithdraw(uint256 amount)
        public
        view
        returns (uint256 payment)
    {
        // How much is the amount compared to the total supply?
        uint256 withPadding = amount * precision;
        uint256 dividedByTotal = (withPadding / ric.totalSupply());

        uint256 calculatedValue = dividedByTotal *
            balance[hashBalance(Balance.current)];
        payment = calculatedValue / precision;
    }

    function withdrawETH(uint256 amount) external {
        require(!lock, "925");
        lock = true;
        require(ric.balanceOf(msg.sender) >= amount, "934");
        uint256 _reward = calculateETHWithdraw(amount);
        require(_reward < balance[hashBalance(Balance.current)], "927");
        balance[hashBalance(Balance.current)] -= _reward;
        // Lock the ric in the vault
        ricVault.lockFor(msg.sender, periods[Periods.singleLock], amount);
        // reduce the balance and send it
        Address.sendValue(payable(msg.sender), _reward);
        lock = false;
        emit WithdrawEth(msg.sender, _reward, amount);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
        balance[hashBalance(Balance.current)] += msg.value;
        balance[hashBalance(Balance.total)] += msg.value;
    }

    function getCurrentBalance() external view returns (uint256) {
        return balance[hashBalance(Balance.current)];
    }

    function getTotalBalance() external view returns (uint256) {
        return balance[hashBalance(Balance.total)];
    }

    function withdrawOne(IERC20 from, uint256 amount) external {
        require(!lock, "935");
        lock = true;
        require(addressAdded[address(from)], "939");
        require(ric.balanceOf(msg.sender) >= amount, "934");
        uint256 _reward = calculateWithdraw(from, amount);
        require(_reward < from.balanceOf(address(this)), "927");
        // Register a spend
        balance[hashBalance(address(from))] += _reward;
        // Lock the ric in the vault
        ricVault.lockFor(msg.sender, periods[Periods.trippleLock], amount);

        // transfer the requiested tokens
        from.safeTransfer(msg.sender, _reward);

        lock = false;
        emit WithdrawToken(msg.sender, from, amount, _reward);
    }

    function viewSpentBalanceOf(IERC20 _token_)
        external
        view
        returns (uint256)
    {
        return balance[hashBalance(address(_token_))];
    }

    function hashBalance(Balance _balance_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_balance_));
    }

    // hashBalance with the address parameter is used for IERC20 address spent balance tracking
    // It was done like this because of the limit on variable declarations in the contract
    function hashBalance(address _balance_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_balance_));
    }
}
