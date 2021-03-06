//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RicSale
 * The rate calculation makes the assumption that 40 000 000 RIC tokens will be sold.

 * @dev Crowdsale is th base contract for managing this token crowdsale,
 * allowing investors to purchase tokens with ether. This contract implements
 * such functionality in its most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 * The external interface represents the basic interface for purchasing tokens, and conforms
 * the base architecture for crowdsales. It is *not* intended to be modified / overridden.
 * The internal interface conforms the extensible and modifiable surface of crowdsales. Override
 * the methods to add functionality. Consider using 'super' where appropriate to concatenate
 * behavior.
 */

contract RicSale is Context, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // The token being sold
    IERC20 private _token;

    // Address where funds are collected
    address payable private _wallet;

    // Amount of wei raised
    uint256 private _weiRaised;

    uint256 private tokensSold;

    // An address can only make 1 purchase per rate.
    // This tracks if an address purchased tokens at a rate already or not
    mapping(address => mapping(uint256 => bool)) private purchased;

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokensPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    /**
     * @param _wallet_ Address where collected funds will be forwarded to
     * @param _token_ Address of the token being sold
     */
    constructor(address payable _wallet_, IERC20 _token_) {
        require(_wallet_ != address(0), "948");
        require(address(_token_) != address(0), "948");

        _wallet = _wallet_;
        _token = _token_;
        tokensSold = 0;
    }

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer funds with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    receive() external payable {
        buyTokens();
    }

    /**
     * @return the token being sold.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the address where funds are collected.
     */
    function wallet() public view returns (address payable) {
        return _wallet;
    }

    /**
     * @return the amount of wei raised.
     */
    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    function purchasedAlready(address _address) public view returns (bool) {
        uint256 currentRate = getCurrentRate(tokensSold);
        return purchased[_address][currentRate];
    }

    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     * This function has a non-reentrancy guard, so it shouldn't be called by
     * another `nonReentrant` function.
     */
    function buyTokens() public payable nonReentrant {
        require(tokensSold <= 40000000e18, "955");
        uint256 weiAmount = msg.value;
        uint256 currentRate = getCurrentRate(tokensSold);

        _preValidatePurchase(
            msg.sender,
            weiAmount,
            purchased[msg.sender][currentRate]
        );
        purchased[msg.sender][currentRate] = true;
        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(currentRate, weiAmount);
        require(tokens <= 100000e18, "950"); // Maximum purchase amount per purchase
        tokensSold = tokensSold.add(tokens);
        // update state
        _weiRaised = _weiRaised.add(weiAmount);

        _processPurchase(msg.sender, tokens);
        emit TokensPurchased(_msgSender(), msg.sender, weiAmount, tokens);

        _updatePurchasingState(msg.sender, weiAmount);

        _forwardFunds();
        _postValidatePurchase(msg.sender, weiAmount);
    }

    /**
     * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met.
     * Use `super` in contracts that inherit from Crowdsale to extend their validations.

     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _preValidatePurchase(
        address beneficiary,
        uint256 weiAmount,
        bool _purchased_
    ) internal pure {
        require(beneficiary != address(0), "948");
        require(weiAmount != 0, "949");
        require(!_purchased_, "951");
    }

    /**
     * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid
     * conditions are not met.
     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _postValidatePurchase(address beneficiary, uint256 weiAmount)
        internal
        view
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends
     * its tokens.
     * @param beneficiary Address performing the token purchase
     * @param tokenAmount Number of tokens to be emitted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        // Token delivery requires allowance
        _token.safeTransferFrom(_wallet, beneficiary, tokenAmount);
    }

    /**
     * @dev Executed when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send
     * tokens.
     * @param beneficiary Address receiving the tokens
     * @param tokenAmount Number of tokens to be purchased
     */
    function _processPurchase(address beneficiary, uint256 tokenAmount)
        internal
    {
        _deliverTokens(beneficiary, tokenAmount);
    }

    /**
     * @dev Checks the amount of tokens left in the allowance.
     * @return Amount of tokens left in the allowance
     */
    function remainingTokens() public view returns (uint256) {
        return
            Math.min(
                token().balanceOf(_wallet),
                token().allowance(_wallet, address(this))
            );
    }

    /**
     * @dev Override for extensions that require an internal state to check for validity (current user contributions,
     * etc.)
     * @param beneficiary Address receiving the tokens
     * @param weiAmount Value in wei involved in the purchase
     */
    function _updatePurchasingState(address beneficiary, uint256 weiAmount)
        internal
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function getTokensSold() external view returns (uint256) {
        return tokensSold;
    }

    function getCurrentRate(uint256 _tokensSold_)
        public
        pure
        returns (uint256)
    {
        if (_tokensSold_ < 4000000e18) {
            return 10;
        } else if (_tokensSold_ >= 4000000e18 && _tokensSold_ < 8000000e18) {
            return 9;
        } else if (_tokensSold_ >= 8000000e18 && _tokensSold_ < 12000000e18) {
            return 8;
        } else if (_tokensSold_ >= 12000000e18 && _tokensSold_ < 16000000e18) {
            return 7;
        } else if (_tokensSold_ >= 16000000e18 && _tokensSold_ < 20000000e18) {
            return 6;
        } else if (_tokensSold_ >= 20000000e18 && _tokensSold_ < 24000000e18) {
            return 5;
        } else if (_tokensSold_ >= 24000000e18 && _tokensSold_ < 28000000e18) {
            return 4;
        } else if (_tokensSold_ >= 28000000e18 && _tokensSold_ < 32000000e18) {
            return 3;
        } else if (_tokensSold_ >= 32000000e18 && _tokensSold_ < 36000000e18) {
            return 2;
        } else if (_tokensSold_ >= 36000000e18 && _tokensSold_ < 40000000e18) {
            return 1;
        } else {
            return 1;
        }
    }

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 currentRate, uint256 weiAmount)
        internal
        pure
        returns (uint256)
    {
        return currentRate.mul(weiAmount);
    }

    /**
     * @dev Determines how ETH is stored/forwarded on purchases.
     */
    function _forwardFunds() internal {
        _wallet.transfer(msg.value);
    }
}
