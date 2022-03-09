# Ricardian Fabric DAO Contracts

# THE MAINTAINED CODE HAD MOVED TO THE ORGANIZATION https://github.com/Ricardian-Fabric/ricardian-dao-contracts
# THIS REPO IS DEPRECATED

The smart contracts in this library are the DAO contracts for Ricardian Fabric.

## Testnet addresses

Signup deployed to: 0xC513a5B27F802980B3b9be9e95A2dEe1F2FEd6d2

Trails deployed to 0xf8214Ae56b2d1dc6b7F7E3F981A2624AdcC81746

CatalogDAO library deployed to: 0x8B71E8277b231b20d10115383DD7CDd212198357

Catalogdao deployed to: 0x13c112Ce9E7466D487F66602e0ae8D20826976f9

Ric deployed to: 0x7d02F0be57dC3Cf9Bfa49F6e859415981166F49b

Ric sale deployed to: 0x0607b120F87876aFa9Fa898DE10c7ad293e4476a

ArweavePs deployed to: 0x705fB7fd5e95Fb04F1342b6879465B47030638C4

DaoStaking deployed to: 0x51780909577786Ab1a3Ab70D9a2a7c2b4571d489

FeeDao deployed to: 0x23928e76411cA69Bbb89E8c843F35917580Ee409

Ric vault deployed to: 0x0Da072BD910F144917cf40f48A614c9Ae4aBB9cd

## Smart contracts

You can find the Api in the /docs folder.

#### SignUp

- The signup contract is a **ricardian contract**, with a smart contract (SimpleTerms) on the Harmony network.
- Users must accept it to use the application.

#### CatalogDao

- Used for contributing content (smart contracts) to the application that users can later select and use.
- Users can submit proposals on what smart contracts should be in the catalog.
- The smart contract proposals are **uploaded to Arweave** and members **vote on the Transaction Id** of the content.
- Governance is with **Rank points** and **manual code reviews**.
- **10 approval points** are needed to pass a proposal.
- Users need to apply for **rank**, it **represents vote weight**.
- Rank 1 are addresses with accepted rank proposals, they can propose new smart contracts
- An address that submits 5 smart contracts is elevated to rank 2.
- After submitting 20 smart contrats, the vote weight is elevated to 3.
- The stake grows with the rank because accepted smart contracts can be used to claim rewards!
- Winning proposals are deployable in Ricardian Fabric from the catalog.
- Allows developers to **work for the DAO**.
- Allows **punishing malicious proposals**.
- **Uses a ricardian contract** to define the conditions to pass the proposal review.

#### DaoStaking

### IMPORTANT THE CONTRIBUTOR REWARDS ARE STILL BEING TWEAKED!

- **Staking is for sybil resistance**.
- **30 Ric must be staked** before contributing to the CatalogDao.
- Malicious users can loose their stake.
- Proposals and Voting with the catalogDao increase the stake lock up time.
  So it's not possible to submit a malicious proposal and unstake fast, to avoid penalty.
- Pays **300 -10000 Ric rewards** to successful contributors!
- 50% of the reward is payed out and 50% goes on the stake.
- **300 Ric** for **smart contract code**.
- **600 Ric** for a **smart contract code with a front end**.
- **600 Ric** for a **smart contract code with fees sent to the FeeDao**
- **10000 Ric** for a **smart contract code with both front end and fees sent to the FeeDao**.
- Contributors can retire and **unstake to claim the accumulated stake rewards**.Their rank will go to 0 and they need to apply again for rank to restart proposing contracts.

#### ArweavePS

- A 10% fee in AR is taken while somebody is uploading to the permaweb. It's distributed to addresses that register for profit sharing using the smart contract on Harmony.
- **Must be staking to get Arweave rewards** for sybil resistance.

#### Ric

- The ERC20 token of **Ric**ardian Fab**ric**.

- Total supply of **100.000.000 Ric** tokens are minted on deployment.

- **No more tokens will be created.**

- **Membership** token that is used for Governance, **Rewards** and **for fee distribution**.

#### FeeDao

- **Contributors to the catalog are bound by a Ricardian contract to transfer any fees they collect to this smart contract.**

- The FeeDao allows **proposing and voting on ERC20 contract addresses** that can be used by the apps in the catalog.

- Ric holders can **withdraw the accumulated fees as profit**, in exchange for locking up the used Ric tokens in the RicVault.

- **Only fees supported by this contract**, can be used to pass reviews in the CatalogDao.

#### RicSale

- Users can **join the community** by buying Ric and can **become contributors** to the catalog or later **take out FeeDao rewards**.
- Tokens are sold with an incrementing price, see the token allocation.

#### RicVault

- Useful for **locking up Ric** for a certain amount of blocks.
- **Used by the deployer to give insurance against dumping**.
- The **FeeDao locks up Ric** after a reward is claimed.
- Ric is **released after the required block number**.

### Token allocation table

You can find the allocation as code in the deployment script.

| Supply | Allocation                                                                                      | Commitment                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20%    | Transfered to the DaoStaking contract and will be used for reward distribution for contributors | Sponsoring 2000 contributions to the catalog with the max reward of 10000 Ric per proposal.                                                                                                         |
| 40%    | Membership tokens are sold with an increasing rate of 0.1 ONE to 1 ONE per Ric.                 | Committed to run a new validator and delegate ONE to support decentralization of Harmony after the sale.                                                                                            |
| 20%    | Used for sponsoring the future development of Ricardian Fabric                                  | The tokens are divided and locked in the RicVault and 10% of this allocation is released every 5 months back to the deployer. The deployer commits for further lock ups as the tokens are released. |
| 20%    | Ecosystem, Liquidity, Grants, Rewards...                                                        | Lock ups like above. Committed to not exchange these directly to other tokens. These will be used for adding liquidity to DEX, Grants for developers to help stake, rewards for contributions...    |

### Build

    npx hardhat commpile

### Tests

    npx hardhat test

### Deploy

    npx hardhat node

    npx hardhat run --network localhost scripts/deploy.ts
