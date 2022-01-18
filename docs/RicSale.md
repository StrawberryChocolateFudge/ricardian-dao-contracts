# RicSale

The Ric token is sold from the app via this crowdsale contract. This contract is based on the open zeppelin crowdsale contract.

# Constructor

    constructor(address payable _wallet_, IERC20 _token_);

The deployer passes in wallet of the address where he collects the payments and the token for sale.

# External functions

    receive() external payable;

If eth is transfered, the receive will call buyTokens, but it's preferred to call buyTokens instead of a direct transfer.

    function buyTokens() public payable nonReentrant;

The prefered way to purchase tokens is via the buy functions. Max tokens sold are 40.000.000.
An address can only purchase max 100.000 tokens per Rate as it increases.

# View functions

    function token() public view returns (IERC20);

Returns the tokens being sold.

    function wallet() public view returns (address payable);

Return the funds where the wallet is collected;

    function weiRaised() public view returns (uint256);

Returns the amount of Wei raised

    function remainingTokens() public view returns (uint256);

Returns the amount of tokens remaining for sale.

    function getCurrentRate(uint256 _tokensSold_)
    	public
    	pure
    	returns (uint256);

Returns the current rate at which the tokens are sold.
The sale starts at rate 100 and after every 20.000.000 tokens sold, it's incrementing until 40.000.000 are sold.

The final rate for the last tokens is 1.

This will be deployed on Harmony so the sale price starts at 0.01 ONE (around 0.003 USD) and increments till 1 ONE ( around 0.3 USD)

    function purchasedAlready(address _address) public view returns (bool);

Returns if the address has made a purchase at the current price rate.
