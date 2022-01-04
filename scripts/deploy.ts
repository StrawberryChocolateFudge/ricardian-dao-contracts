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

  const RICTOTALSUPPLY = "10000000";
  const FEEDAOPOLLPERIOD = 10;
  const CATALOGPOLLPERIOD = 10;
  const SignUp = await ethers.getContractFactory("SimpleTerms");
  const signUp = await SignUp.deploy();
  const signup = await signUp.deployed();

  const RicToken = await ethers.getContractFactory("Ric");

  const ricToken = await RicToken.deploy(
    ethers.utils.parseEther(RICTOTALSUPPLY)
  );

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
  const catalogDAO = await CatalogDAO.deploy(
    CATALOGPOLLPERIOD,
    daoStaking.address
  );
  await catalogDAO.deployed();
  daoStaking.setCatalogDao(catalogDAO.address);

  const FeeDAO = await ethers.getContractFactory("FeeDao");
  const feeDao = await FeeDAO.deploy(
    ric.address,
    daoStaking.address,
    catalogDAO.address,
    FEEDAOPOLLPERIOD
  );
  const feedao = await feeDao.deployed();

  const RicVault = await ethers.getContractFactory("RicVault");
  const ricVault = await RicVault.deploy(ric.address);
  const ricvault = await ricVault.deployed();

  await feedao.setRicVault(ricvault.address);
  await ricvault.setFeeDao(feedao.address);
  console.log("Signup deployed to:", signup.address);
  console.log("CatalogDAO library deployed to:", catalogdaolib.address);
  console.log("Catalogdao deployed to:", catalogDAO.address);
  console.log("Ric deployed to:", ric.address);
  console.log("ArweavePs deployed to:", arweaveps.address);
  console.log("DaoStaking deployed to:", daoStaking.address);
  console.log("FeeDao deployed to:", feedao.address);
  console.log("Ric vault deployed to: ", ricvault.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
