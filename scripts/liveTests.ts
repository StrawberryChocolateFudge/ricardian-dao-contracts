import { ethers } from "hardhat";

async function main() {
  const ricSale = await ethers.getContractFactory("RicSale");
  const ricsale = ricSale.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  console.log(await ricsale.remainingTokens());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
