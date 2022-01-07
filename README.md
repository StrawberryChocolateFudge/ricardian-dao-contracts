# Ricardian Fabric DAO Contracts

The smart contracts in this library are the DAO contracts for Ricardian Fabric.

### Build

    npx hardhat commpile

### Tests

    npx hardhat test

### Deploy

    npx hardhat node

    npx hardhat run --network localhost scripts/deploy.ts

### Smart contract Docs

You can find the Api in the /docs folder.

#### SignUp

- The signup contract is a **ricardian contract**, with a smart contract on the Harmony network.
- Users must accept it to use the application.

#### CatalogDao

- Used for contributing content (smart contracts) to the application that users can later select and use.
- Governance is with **Rank points** and **manual code reviews**.
- The smartcontract proposal is **uploaded to Arweave** and members **vote on the Transaction Id** of the content.
- Winning proposals are displayed on the front end.
- Allows developers to **work for the DAO**.
- Allows punishing malicious proposals.
- **Uses a ricardian contract** to define the conditions to pass the review.

#### DaoStaking

- **Staking is for sybil resistance**.
- **30 Ric must be staked** to contribute to the CatalogDao.
- Malicious users can loose their stake.
- All actions on the CatalogDao increase the stake lock up time. This is a safety mechanism.
- Pays **300 -1000 Ric rewards** for successful contributors!
- **300 Ric** for **smart contract code**.
- **600 Ric** for a **smart contract code with a front end**.
- **600 Ric** for a **smart contract code with fees sent to the FeeDao**
- **1000 Ric** for a **smart contract code both front end and fees sent to the FeeDao**.

#### ArweavePS

- A small fee in AR is taken while uploading to the permaweb. It's distributed to addresses that register for profit sharing using the smart contract on Harmony.
- **Must be staking to get Arweave rewards**.

#### Ric

- The ERC20 token of Ricardian Fabric.

- Total supply of **100.000.000 Ric** tokens are minted on deployment.

- **No more tokens will be created.**

- **Governance** token that represents membership and **allows contribution** and **used for collecting rewards**.

#### FeeDao

- **Contributors to the catalog are bound by a Ricardian contract to transfer any fees they collect to this smart contract.**

- The FeeDao allows **proposing and voting on ERC20 contract addresses** that can be used by the apps in the catalog.

- Ric holders can **withdraw the accumulated fees as profit**, in exchange for locking up the used Ric tokens in the RicVault.

- **Only fees supported by this contract** can be used to pass reviews in the CatalogDao.

#### RicSale

- Users can **join the community** by buying Ric and can **become contributors** to the catalog or later **take out FeeDao rewards**.
- Memberships are sold with an incrementing price, see the token allocation.

#### RicVault

- Useful for **locking up Ric** for a certain amount of blocks.
- **Used by the deployer to give insurance against dumping**.
- Used when fees are taken out, **the FeeDao locks up Ric** after a reward is claimed.
- Ric is **released after the required block number**.

### Token allocation table

You can find the allocation as code in the deployment script.

| Supply | Allocation                                                                                                | Commitment                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20%    | Transfered to the DaoStaking contract and will be used for reward distribution for contributors           | Sponsoring 20.000 contributions to the catalog.                                                                                                                |
| 40%    | Used for the RicSale contract. Memberships are sold with an increasing rate of 0.01 ONE to 1 ONE per Ric. | Committed to run a new validator and delegate ONE to support decentralization of Harmony after the sale.                                                       |
| 20%    | Used for sponsoring the future development of Ricardian Fabric                                            | All tokens are locked in the RicVault and 2% is released every 5 months to the deployer. The deployer commits for further lock ups as the tokens are released. |
| 20%    | Ecosystem, Liquidity, Grants, Airdrops...                                                                 | Committed to not exchange it to other tokens.                                                                                                                  |
