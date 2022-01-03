//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FeeDao.sol";
struct LockedTokens {
    address owner; // the owner who locks and can redeem the tokens
    uint256 created; // The block.number when the tokens were locked.
    uint256 period; // The amount of blocks the RIC is locked for
    uint256 lockedAmount; // How much RIC was locked,
    bool released;
}

contract RicVault {
    using SafeERC20 for IERC20;

    uint256 private totalLocked;
    mapping(address => mapping(uint256 => LockedTokens)) private inVault;
    mapping(address => uint256) private lockIndex;

    uint8 private lock;

    IERC20 private ric;

    FeeDao private feeDao;

    address private owner;

    event LockedFunds(address indexed owner, uint256 period, uint256 amount);
    event ReleasedFunds(address indexed owner, uint256 amount);

    constructor(IERC20 _ric_) {
        totalLocked = 0;
        ric = _ric_;
        owner = msg.sender;
    }

    function setFeeDao(FeeDao _feedao_) external {
        require(msg.sender == owner, "937");
        feeDao = _feedao_;
    }

    function lockFor(
        address _owner_,
        uint256 _period_,
        uint256 _amount_
    ) external returns (LockedTokens memory) {
        require(lock == 0, "Locked");
        lock = 1;
        require(msg.sender == address(feeDao), "940");
        require(ric.balanceOf(_owner_) >= _amount_, "934");
        // Transfer the allowance from the owner to this smart contract
        ric.safeTransferFrom(_owner_, address(this), _amount_);
        lockIndex[_owner_] += 1;
        inVault[_owner_][lockIndex[_owner_]] = LockedTokens({
            owner: _owner_,
            created: block.number,
            period: _period_,
            lockedAmount: _amount_,
            released: false
        });
        totalLocked += _amount_;
        lock = 0;
        emit LockedFunds(_owner_, _period_, _amount_);
        return inVault[_owner_][lockIndex[_owner_]];
    }

    function release(uint256 _index_) external returns (LockedTokens memory) {
        require(lock == 0, "935");
        lock = 1;
        require(inVault[msg.sender][_index_].owner == msg.sender, "941");
        require(
            inVault[msg.sender][_index_].created +
                inVault[msg.sender][_index_].period >
                block.number,
            "942"
        );
        require(!inVault[msg.sender][_index_].released, "943");
        inVault[msg.sender][_index_].released = true;
        ric.safeTransfer(msg.sender, inVault[msg.sender][_index_].lockedAmount);
        totalLocked -= inVault[msg.sender][_index_].lockedAmount;
        lock = 0;
        emit ReleasedFunds(
            msg.sender,
            inVault[msg.sender][_index_].lockedAmount
        );
        return inVault[msg.sender][_index_];
    }

    function getTotalLocked() external view returns (uint256) {
        return totalLocked;
    }

    function getLockIndex(address _for_) external view returns (uint256) {
        return lockIndex[_for_];
    }

    function getVaultContent(address _for_, uint256 _index_)
        external
        view
        returns (LockedTokens memory)
    {
        return inVault[_for_][_index_];
    }
}
