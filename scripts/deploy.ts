// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
export const RICTOTALSUPPLY = "100000000"; // 100.000.000
export const DAOSTAKINGALLOCATION = "20000000"; // 20.000.000
export const MEMBERSHIPALLOCATION = "40000000"; // 40.000.000

export const RICKVAULTALLOCATION = "40000000"; // TOTAL RIC ALLOCATION 20.000.000
export const RICTOLOCK = "2000000"; // 2.000.000 Lock this amount for RICLOCKINTERVAL
export const RICLOCKINTERVAL = 7000000; // 7.000.000

export const FEEDAOPOLLPERIOD = 259200; // The front end is coded to use the same values for the periods!
export const CATALOGPOLLPERIOD = 259200; // around 6 days

const DAOSTAKINGPERIOD = 864000; // around 20 days
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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
  setTimeout(async () => {
    const SignUp = await ethers.getContractFactory("SimpleTerms");
    const signUp = await SignUp.deploy();
    const signup = await signUp.deployed();

    setTimeout(async () => {
      const TrailsRegistry = await ethers.getContractFactory("TrailsRegistry");
      const trailsRegistry = await TrailsRegistry.deploy();
      const trails = await trailsRegistry.deployed();

      setTimeout(async () => {
        const RicToken = await ethers.getContractFactory("Ric");

        const ricToken = await RicToken.deploy(
          ethers.utils.parseEther(arg.RICTOTALSUPPLY)
        );

        const ric = await ricToken.deployed();
        setTimeout(async () => {
          const RICSale = await ethers.getContractFactory("RicSale");
          // TODO: THIS IS THE LIVE TESTNET PUBLIC KEY
          const RicSale = await RICSale.deploy(
            "0xDF16399E6F10bbC1C07C88c6c70116182FA2e118",
            ric.address
          );
          const ricsale = await RicSale.deployed();
          setTimeout(async () => {
            const ArweavePS = await ethers.getContractFactory("ArweavePS");
            const arweavePS = await ArweavePS.deploy();
            const arweaveps = await arweavePS.deployed();
            setTimeout(async () => {
              const DAOStaking = await ethers.getContractFactory("DaoStaking");

              const DaoStaking = await DAOStaking.deploy(
                ric.address,
                arweaveps.address,
                arg.DAOSTAKINGPERIOD
              );
              const daoStaking = await DaoStaking.deployed();
              setTimeout(async () => {
                await arweaveps.setStakingLib(daoStaking.address);
                setTimeout(async () => {
                  const CatalogDAOLib = await ethers.getContractFactory(
                    "CatalogDaoLib"
                  );
                  const catalogDAOLib = await CatalogDAOLib.deploy();
                  const catalogdaolib = await catalogDAOLib.deployed();
                  setTimeout(async () => {
                    const CatalogDAO = await ethers.getContractFactory(
                      "CatalogDao",
                      {
                        libraries: { CatalogDaoLib: catalogdaolib.address },
                      }
                    );
                    // The voting period should be 302400 on Harmony network
                    // It's 259200 now on Harmony testnet
                    const catalogDAO = await CatalogDAO.deploy(
                      arg.CATALOGPOLLPERIOD,
                      daoStaking.address
                    );
                    await catalogDAO.deployed();
                    setTimeout(async () => {
                      daoStaking.setCatalogDao(catalogDAO.address);
                      setTimeout(async () => {
                        const FeeDAO = await ethers.getContractFactory(
                          "FeeDao"
                        );
                        const feeDao = await FeeDAO.deploy(
                          ric.address,
                          daoStaking.address,
                          catalogDAO.address,
                          arg.FEEDAOPOLLPERIOD
                        );
                        const feedao = await feeDao.deployed();
                        setTimeout(async () => {
                          const RicVault = await ethers.getContractFactory(
                            "RicVault"
                          );
                          const ricVault = await RicVault.deploy(ric.address);
                          const ricvault = await ricVault.deployed();
                          setTimeout(async () => {
                            await feedao.setRicVault(ricvault.address);
                            setTimeout(async () => {
                              await ricvault.setFeeDao(feedao.address);
                              setTimeout(async () => {
                                console.log(
                                  "Signup deployed to:",
                                  signup.address
                                );
                                console.log(
                                  "Trails deployed to ",
                                  trails.address
                                );
                                console.log(
                                  "CatalogDAO library deployed to:",
                                  catalogdaolib.address
                                );
                                console.log(
                                  "Catalogdao deployed to:",
                                  catalogDAO.address
                                );
                                console.log("Ric deployed to:", ric.address);
                                console.log(
                                  "Ric sale deployed to:",
                                  ricsale.address
                                );
                                console.log(
                                  "ArweavePs deployed to:",
                                  arweaveps.address
                                );
                                console.log(
                                  "DaoStaking deployed to:",
                                  daoStaking.address
                                );
                                console.log(
                                  "FeeDao deployed to:",
                                  feedao.address
                                );
                                console.log(
                                  "Ric vault deployed to: ",
                                  ricvault.address
                                );
                                setTimeout(async () => {
                                  await ric.approve(
                                    daoStaking.address,
                                    ethers.utils.parseEther(
                                      arg.DAOSTAKINGALLOCATION
                                    )
                                  );
                                  setTimeout(async () => {
                                    // 20 % goes to the daoStaking reward

                                    await daoStaking.depositRewards(
                                      ethers.utils.parseEther(
                                        arg.DAOSTAKINGALLOCATION
                                      )
                                    );
                                    setTimeout(async () => {
                                      // 40 % goes to the membership (crowdsale) contract
                                      // No transfer, only approval
                                      await ric.approve(
                                        ricsale.address,
                                        ethers.utils.parseEther(
                                          arg.MEMBERSHIPALLOCATION
                                        )
                                      );
                                      setTimeout(async () => {
                                        console.log(
                                          await ric.allowance(
                                            "0xDF16399E6F10bbC1C07C88c6c70116182FA2e118",
                                            ricsale.address
                                          )
                                        );
                                        console.log(
                                          await ricsale.remainingTokens()
                                        );

                                        // 20 % goes to the Ric vault,
                                        await ric.approve(
                                          ricvault.address,
                                          ethers.utils.parseEther(
                                            arg.RICKVAULTALLOCATION
                                          )
                                        );
                                      }, 38000);
                                    }, 36000);
                                  }, 34000);
                                }, 32000);
                              }, 30000);
                            }, 28000);
                          }, 26000);
                        }, 24000);
                      }, 22000);
                    }, 20000);
                  }, 18000);
                }, 16000);
              }, 14000);
            }, 12000);
          }, 10000);
        }, 8000);
      }, 6000);
    }, 4000);
  }, 2000);

  // We get the contract to deploy

  // Token allocation script!

  // Locked with increasing lock up periods for RICTOLOCK amount of tokens.
  // 1. RICTOLOCK is 2% of the total supply
  // for (let i = 1; i <= 16; i++) {
  //   await ricvault.lockFunds(
  //     arg.RICLOCKINTERVAL * i,
  //     ethers.utils.parseEther(arg.RICTOLOCK)
  //   );
  // }
  // 20 % Ecosystem / Liquidity / 30 RIC Grants / wallet for making proposals / Airdrops

  // Manual lockups!
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
