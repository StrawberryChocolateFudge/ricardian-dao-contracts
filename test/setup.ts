import { ethers, network } from "hardhat";

export async function setUp() {
  const [owner, participant1, participant2, participant3, participant4] =
    await ethers.getSigners();

  const CatalogDAOLib = await ethers.getContractFactory("CatalogDaoLib");
  const catalogDAOLib = await CatalogDAOLib.deploy();
  const catalogdaolib = await catalogDAOLib.deployed();
  const CatalogDAO = await ethers.getContractFactory("CatalogDao", {
    libraries: { CatalogDaoLib: catalogdaolib.address },
  });

  // @ts-ignore
  const catalogDAO = await CatalogDAO.deploy(100);
  await catalogDAO.deployed();

  return {
    catalogDAO,
    owner,
    participant1,
    participant2,
    participant3,
    participant4,
  };
}

export async function expectRevert(
  asyncCallback: CallableFunction,
  errString: string
) {
  let throws = false;
  let err = "";
  try {
    await asyncCallback();
  } catch (e: any) {
    throws = true;
    err = e.message;
  }

  if (!throws) {
    throw new Error(`ErrorCode ${errString}`);
  }
  if (!err.includes(errString)) {
    console.warn(err);
    throw new Error(`ErrorCode ${errString} is not in the error`);
  }

  // Check if it throws and if it threw the correct error
  return {
    throws,
    correct: err.includes(errString),
  };
}

export async function mineBlocks(blockNumber: number) {
  console.log(`    ⛏️️`);
  while (blockNumber > 0) {
    blockNumber--;
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}
