// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const RicToken = await ethers.getContractFactory("Ric");

  const ricToken = await RicToken.deploy(ethers.utils.parseEther("10000000"));
  const ric = await ricToken.deployed();

  const ArweavePS = await ethers.getContractFactory("ArweavePS");
  const arweavePS = await ArweavePS.deploy();
  const arweaveps = await arweavePS.deployed();
  const DAOStaking = await ethers.getContractFactory("DaoStaking");

  const DaoStaking = await DAOStaking.deploy(
    ric.address,
    arweaveps.address,
    100 // The staki is locked for only 100 blocks for testing purposeszs
  );
  const daoStaking = await DaoStaking.deployed();
  await arweaveps.setStakingLib(daoStaking.address);
  // We get the contract to deploy
  const CatalogDAOLib = await ethers.getContractFactory("CatalogDaoLib");
  const catalogDAOLib = await CatalogDAOLib.deploy();
  const catalogdaolib = await catalogDAOLib.deployed();
  const CatalogDAO = await ethers.getContractFactory("CatalogDao", {
    libraries: { CatalogDaoLib: catalogdaolib.address },
  });
  // The voting period should be 302400 on Harmony network
  // It's 10 on Hardhat
  const catalogDAO = await CatalogDAO.deploy(10, daoStaking.address);
  await catalogDAO.deployed();
  daoStaking.setCatalogDao(catalogDAO.address);

  const TreasuryBoard = await ethers.getContractFactory("TreasuryBoard");
  const treasuryBoard = await TreasuryBoard.deploy(
    ric.address,
    daoStaking.address,
    10 // Poll period of 10 blocks for testing
  );
  console.log("Catalogdao deployed to:", catalogDAO.address);
  console.log("Ric deployed to:", ric.address);
  console.log("ArweavePs deployed to:", arweaveps.address);
  console.log("DaoStaking deployed to:", daoStaking.address);
  console.log("TreasuryBoard deployed to:", treasuryBoard.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
