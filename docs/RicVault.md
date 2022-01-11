# Ric vault

The Ric vault is used by the deployer to provide security agains dumping. The tokens owned by the deployer are all locked up in the vault and are slowly released back.

Another use case for the vault is when using the feeDao to take out fees, Ric is locked up for a period, to avoid the users claiming the fees to often.

## Constructor

    constructor(IERC20 _ric_);

The deployer passes in the address of the Ric token on deployment.

## External functions

    function setFeeDao(FeeDao _feedao_) external;

Called by the owner only, the feeDao address can be set.

    function lockFunds(uint256 _period_, uint256 _amount_)
    	external
    	returns (LockedTokens memory);

A user can lock funds,the _period_ is the blocks it will be locked for and the _amount_ is the Ric that gets locked.
Calling this function required granting allowance to the RicVault, it uses safeTransferFrom.

    function lockFor(
    	address _owner_,
    	uint256 _period_,
    	uint256 _amount_
    ) external returns (LockedTokens memory);

    function release(uint256 _index_) external returns (LockedTokens memory);

Call this function to release locked tokens.
LockedTokens objects are stored indexed per address. use the _index_ to access your own locked tokens that you want to release.

## View functions

    function getTotalLocked() external view returns (uint256);

Returns the amount of total locked tokens from the vault.

    function getLockIndex(address _for_) external view returns (uint256);

Returns the last index that can be used to access locked Tokens objects for an address.

    function getVaultContent(address _for_, uint256 _index_)
    	external
    	view
    	returns (LockedTokens memory);

Returns the vault content for and address _for_ at an index _index_, to find out what index to use, call the getLockIndex first with the address.

    struct LockedTokens {
        address owner; // the owner who locks and can redeem the tokens
        uint256 created; // The block.number when the tokens were locked.
        uint256 period; // The amount of blocks the RIC is locked for
        uint256 lockedAmount; // How much RIC was locked,
        bool released;
    }

## Events

    event LockedFunds(address indexed owner, uint256 period, uint256 amount);

Emitted when funds are locked

    event ReleasedFunds(address indexed owner, uint256 amount);

Emitted when funds are released
