import hre from "hardhat";

async function main() {
  const network = hre.network;
  await network.provider.send("evm_setIntervalMining", [5000]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
