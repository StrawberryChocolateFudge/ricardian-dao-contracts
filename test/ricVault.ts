import { expect } from "chai";
// eslint-disable-next-line node/no-missing-import
import { expectRevert, mineBlocks, setUp } from "./setup";
import { ethers } from "hardhat";
describe("ric vault", function () {
  it("locks ric in vault and releases it", async function () {
    const { participant1, ric, ricvault } = await setUp(true);

    await ric
      .connect(participant1)
      .approve(ricvault.address, ethers.utils.parseEther("10"));

    expect(
      await ricvault
        .connect(participant1)
        .lockFunds(10, ethers.utils.parseEther("10"))
    ).to.emit(ricvault, "LockedFunds");

    expect(await ricvault.getTotalLocked()).to.equal(
      ethers.utils.parseEther("10")
    );
    const lockedTokens = await ricvault.getVaultContent(
      participant1.address,
      1
    );
    expect(lockedTokens.released).to.equal(false);
    expect(lockedTokens.lockedAmount).to.equal(ethers.utils.parseEther("10"));
    expect(lockedTokens.period).to.equal(10); // locked for 10 blocks

    await expectRevert(() => ricvault.connect(participant1).release(1), "942");
    expect(await ric.balanceOf(participant1.address)).to.equal(
      ethers.utils.parseEther("60")
    );
    await mineBlocks(11).then(async () => {
      expect(await ricvault.connect(participant1).release(1)).to.emit(
        ricvault,
        "ReleasedFunds"
      );

      expect(await ric.balanceOf(participant1.address)).to.equal(
        ethers.utils.parseEther("70")
      );
    });
  });
});
