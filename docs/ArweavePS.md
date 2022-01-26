# ArweavePS

All staking users can get Ar (Arweave) fees transfered to their address from the client app.
They must register their address here.

## API

### External Functions

    function setStakingLib(DaoStaking _staking) external onlyOwner;

The owner sets the DaoStaking contract address after deployment with this.

    function setPS(string calldata _to) external;

A staking contributor can set profit sharing to his address. \_to should be a valid arweave address, the client performs the checks for the valid address when it's transfering the fees.

    function stoppedStaking(address _address) external;

Only the DaoStaking contract can call this, if a user unstakes, the arweave profit sharing is stopped also.

     function stopPS() external;

A user can choose to stop getting profit sharing rewards.

### View functions

    function getAllPS() external view returns (ProfitShare[] memory);

Returns all the profit sharing addresses. This is called by the client to select who get's the cross chain reward.

    function getPS(address _address)
            external
            view
            returns (ProfitShare memory)

Returns the ProfitShare obect of an address

### Events

    event SetPS(address indexed _address, string _to);

Emitted when a profit sharing address is set.

    event StopPS(address indexed _address);

Emitted when an address stops getting Ar rewards
