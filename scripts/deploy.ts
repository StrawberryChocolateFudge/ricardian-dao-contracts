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

  const RICTOTALSUPPLY = "100000000"; // 100.000.000
  const DAOSTAKINGALLOCATION = "20000000"; // 20.000.000
  const MEMBERSHIPALLOCATION = "40000000"; // 40.000.000

  const RICKVAULTALLOCATION = "40000000"; // TOTAL RIC ALLOCATION 20.000.000
  const RICTOLOCK = "2000000"; // 2.000.000 Lock this amount for RICLOCKINTERVAL
  const RICLOCKINTERVAL = 7000000; // 7.000.000

  const FEEDAOPOLLPERIOD = 10;
  const CATALOGPOLLPERIOD = 10;

  const DAOSTAKINGPERIOD = 100; // FOR TEsts the staking period is only 10 blocks for now

  await deploymentScript({
    RICTOTALSUPPLY,
    DAOSTAKINGALLOCATION,
    MEMBERSHIPALLOCATION,
    RICKVAULTALLOCATION,
    RICTOLOCK,
    RICLOCKINTERVAL,
    FEEDAOPOLLPERIOD,
    CATALOGPOLLPERIOD,
    DAOSTAKINGPERIOD,
  });
}

type DeploymentArg = {
  RICTOTALSUPPLY: string;
  DAOSTAKINGALLOCATION: string;
  MEMBERSHIPALLOCATION: string;
  RICKVAULTALLOCATION: string;
  RICTOLOCK: string;
  RICLOCKINTERVAL: number;
  FEEDAOPOLLPERIOD: number;
  CATALOGPOLLPERIOD: number;
  DAOSTAKINGPERIOD: number;
};

// Export for testing
export async function deploymentScript(arg: DeploymentArg) {
  const SignUp = await ethers.getContractFactory("SimpleTerms");
  const signUp = await SignUp.deploy();
  const signup = await signUp.deployed();

  const TrailsRegistry = await ethers.getContractFactory("TrailsRegistry");
  const trailsRegistry = await TrailsRegistry.deploy();
  const trails = await trailsRegistry.deployed();

  const RicToken = await ethers.getContractFactory("Ric");

  const ricToken = await RicToken.deploy(
    ethers.utils.parseEther(arg.RICTOTALSUPPLY)
  );

  const ric = await ricToken.deployed();

  const RICSale = await ethers.getContractFactory("RicSale");
  //TODO: THESE ARE TESTNET ADDRESSES< DO NOT SEND ANYTHING HERE!!
  const RicSale = await RICSale.deploy(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ric.address
  );
  const ricsale = await RicSale.deployed();

  const ArweavePS = await ethers.getContractFactory("ArweavePS");
  const arweavePS = await ArweavePS.deploy();
  const arweaveps = await arweavePS.deployed();
  const DAOStaking = await ethers.getContractFactory("DaoStaking");

  const DaoStaking = await DAOStaking.deploy(
    ric.address,
    arweaveps.address,
    arg.DAOSTAKINGPERIOD // The stake is locked for only 100 blocks for testing purposess
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
    arg.CATALOGPOLLPERIOD,
    daoStaking.address
  );
  await catalogDAO.deployed();
  daoStaking.setCatalogDao(catalogDAO.address);

  const FeeDAO = await ethers.getContractFactory("FeeDao");
  const feeDao = await FeeDAO.deploy(
    ric.address,
    daoStaking.address,
    catalogDAO.address,
    arg.FEEDAOPOLLPERIOD
  );
  const feedao = await feeDao.deployed();

  const RicVault = await ethers.getContractFactory("RicVault");
  const ricVault = await RicVault.deploy(ric.address);
  const ricvault = await ricVault.deployed();

  await feedao.setRicVault(ricvault.address);
  await ricvault.setFeeDao(feedao.address);
  console.log("Signup deployed to:", signup.address);
  console.log("Trails deployed to ", trails.address);
  console.log("CatalogDAO library deployed to:", catalogdaolib.address);
  console.log("Catalogdao deployed to:", catalogDAO.address);
  console.log("Ric deployed to:", ric.address);
  console.log("Ric sale deployed to:", ricsale.address);
  console.log("ArweavePs deployed to:", arweaveps.address);
  console.log("DaoStaking deployed to:", daoStaking.address);
  console.log("FeeDao deployed to:", feedao.address);
  console.log("Ric vault deployed to: ", ricvault.address);

  // Token allocation script!

  // 20 % goes to the daoStaking reward

  await ric.approve(
    daoStaking.address,
    ethers.utils.parseEther(arg.DAOSTAKINGALLOCATION)
  );

  await daoStaking.depositRewards(
    ethers.utils.parseEther(arg.DAOSTAKINGALLOCATION)
  );
  // 40 % goes to the membership (crowdsale) contract
  // No transfer, only approval
  await ric.approve(
    ricsale.address,
    ethers.utils.parseEther(arg.MEMBERSHIPALLOCATION)
  );

  console.log(
    await ric.allowance(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      ricsale.address
    )
  );
  console.log(await ricsale.remainingTokens());

  // 20 % goes to the Ric vault,
  await ric.approve(
    ricvault.address,
    ethers.utils.parseEther(arg.RICKVAULTALLOCATION)
  );

  // Locked with increasing lock up periods for RICTOLOCK amount of tokens.
  // 1. RICTOLOCK is 2% of the total supply
  for (let i = 1; i <= 16; i++) {
    await ricvault.lockFunds(
      arg.RICLOCKINTERVAL * i,
      ethers.utils.parseEther(arg.RICTOLOCK)
    );
  }
  // 20 % Ecosystem / Liquidity / 30 RIC Grants / wallet for making proposals / Airdrops

  // Manual lockups!
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
