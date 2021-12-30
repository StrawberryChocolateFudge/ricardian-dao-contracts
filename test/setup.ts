import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { DaoStaking, Ric } from "../typechain";

export async function setUp(withStake: boolean): Promise<any> {
  const [owner, participant1, participant2, participant3, participant4] =
    await ethers.getSigners();

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
  const CatalogDAOLib = await ethers.getContractFactory("CatalogDaoLib");
  const catalogDAOLib = await CatalogDAOLib.deploy();
  const catalogdaolib = await catalogDAOLib.deployed();
  const CatalogDAO = await ethers.getContractFactory("CatalogDao", {
    libraries: { CatalogDaoLib: catalogdaolib.address },
  });

  // @ts-ignore
  const catalogDAO = await CatalogDAO.deploy(100, daoStaking.address);
  await catalogDAO.deployed();
  daoStaking.setCatalogDao(catalogDAO.address);

  const TreasuryBoard = await ethers.getContractFactory("TreasuryBoard");
  const treasuryBoard = await TreasuryBoard.deploy(
    ric.address,
    daoStaking.address,
    10 // Poll period of 10 blocks for testing
  );

  const treasuryboard = treasuryBoard.deployed();

  catalogDAO.setTerms("url", "value");
  catalogDAO.connect(owner).accept("value");
  catalogDAO.connect(participant1).accept("value");
  catalogDAO.connect(participant2).accept("value");
  catalogDAO.connect(participant3).accept("value");
  catalogDAO.connect(participant4).accept("value");

  if (withStake) {
    await dropTokens(
      ric,
      owner,
      participant1,
      participant2,
      participant3,
      participant4
    );
    await approveSpend(
      ric,
      daoStaking,
      owner,
      participant1,
      participant2,
      participant3,
      participant4
    );

    await stakeAll(
      daoStaking,
      owner,
      participant1,
      participant2,
      participant3,
      participant4
    );
  }

  return {
    catalogDAO,
    owner,
    participant1,
    participant2,
    participant3,
    participant4,
    arweaveps,
    ric,
    daoStaking,
    treasuryboard,
  };
}

export async function dropTokens(
  ric: Ric,
  owner: SignerWithAddress,
  participant1: SignerWithAddress,
  participant2: SignerWithAddress,
  participant3: SignerWithAddress,
  participant4: SignerWithAddress
) {
  await ric
    .connect(owner)
    .transfer(participant1.address, ethers.utils.parseEther("100"));
  await ric
    .connect(owner)
    .transfer(participant2.address, ethers.utils.parseEther("100"));
  await ric
    .connect(owner)
    .transfer(participant3.address, ethers.utils.parseEther("100"));
  await ric
    .connect(owner)
    .transfer(participant4.address, ethers.utils.parseEther("100"));
}

export async function approveSpend(
  ric: Ric,
  staking: DaoStaking,
  owner: SignerWithAddress,
  participant1: SignerWithAddress,
  participant2: SignerWithAddress,
  participant3: SignerWithAddress,
  participant4: SignerWithAddress
) {
  await ric
    .connect(owner)
    .approve(staking.address, ethers.utils.parseEther("30"));
  await ric
    .connect(participant1)
    .approve(staking.address, ethers.utils.parseEther("30"));
  await ric
    .connect(participant2)
    .approve(staking.address, ethers.utils.parseEther("30"));
  await ric
    .connect(participant3)
    .approve(staking.address, ethers.utils.parseEther("30"));
  await ric
    .connect(participant4)
    .approve(staking.address, ethers.utils.parseEther("30"));
}

export async function stakeAll(
  staking: DaoStaking,
  owner: SignerWithAddress,
  participant1: SignerWithAddress,
  participant2: SignerWithAddress,
  participant3: SignerWithAddress,
  participant4: SignerWithAddress
) {
  await staking.connect(owner).stake();
  await staking.connect(participant1).stake();
  await staking.connect(participant2).stake();
  await staking.connect(participant3).stake();
  await staking.connect(participant4).stake();
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
