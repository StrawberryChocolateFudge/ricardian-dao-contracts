import { expect } from "chai";
import {
  setUp,
  dropTokens,
  stakeAll,
  approveSpend,
  expectRevert,
  mineBlocks,
} from "./setup";
import { ethers } from "hardhat";

describe("daoStaking", async function () {
  it("Stakes tokens", async function () {
    const {
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      daoStaking,
      ric,
    } = await setUp(false);
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
    expect(await daoStaking.isStaking(owner.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant1.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant2.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant3.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant4.address)).to.equal(true);

    expect(await daoStaking.getTotalStaked()).to.equal(
      ethers.utils.parseEther("150")
    );

    expect(await daoStaking.getAvailableReward()).to.equal(
      ethers.utils.parseEther("0")
    );
  });
  it("stakes and unstakes", async function () {
    const { participant1, daoStaking, arweaveps } = await setUp(true);

    await arweaveps.connect(participant1).setPS("participant 1 address");

    await expectRevert(() => daoStaking.connect(participant1).unStake(), "924");

    await mineBlocks(100).then(async () => {
      let PS = new Array(await arweaveps.getAllPS());
      expect(PS[0][0].sharing).to.equal(true);
      expect(await daoStaking.connect(participant1).unStake()).to.emit(
        daoStaking,
        "Unstake"
      );
      PS = new Array(await arweaveps.getAllPS());
      expect(PS[0][0].sharing).to.equal(false);

      expect(await daoStaking.isStaking(participant1.address)).to.equal(false);

      await expectRevert(
        () => daoStaking.connect(participant1).unStake(),
        "919"
      );
    });
  });

  it("deposits reward", async function () {
    const { owner, daoStaking, ric } = await setUp(true);

    expect(await daoStaking.getAvailableReward()).to.equal(
      ethers.utils.parseEther("0")
    );
    expect(await ric.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("9999570")
    );
    expect(await ric.balanceOf(daoStaking.address)).to.equal(
      ethers.utils.parseEther("150")
    );

    await ric
      .connect(owner)
      .approve(daoStaking.address, ethers.utils.parseEther("1000"));

    expect(
      await daoStaking
        .connect(owner)
        .depositRewards(ethers.utils.parseEther("100"))
    ).to.emit(daoStaking, "RewardDeposit");

    expect(await daoStaking.getAvailableReward()).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await ric.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("9999470")
    );
    expect(await ric.balanceOf(daoStaking.address)).to.equal(
      ethers.utils.parseEther("250")
    );

    // I expect claimReward fails here
    await expectRevert(() => daoStaking.connect(owner).claimReward(1), "927");
  });
});
