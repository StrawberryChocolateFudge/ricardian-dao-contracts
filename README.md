# Ricardian Fabric DAO Contracts

The smart contracts in this library are the DAO contracts for ricardian fabric.

### Build

    npx hardhat commpile

### Tests

    npx hardhat test

# CatalogDao

This contract is used for voting on the smart contracts in the catalog.
It works with Rank, so users need to get accepted to propose new smart contracts

## Catalog DAO Error codes:

900 : You need 0 rank to get new rank.

901: You need 1 rank to vote.

902: You voted already.

903: The voting period is over.

904: Wrong proposal.

905: The voting is not over.

906: You can't vote on your own removal.

907: The proposal is already closed.
