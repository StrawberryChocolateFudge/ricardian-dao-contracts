import { expect } from "chai";
import {
  setUp,
  expectRevert,
  mineBlocks,
  parseEther,
  // eslint-disable-next-line node/no-missing-import
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
    } = await setUp(true);
    expect(await daoStaking.isStaking(owner.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant1.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant2.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant3.address)).to.equal(true);
    expect(await daoStaking.isStaking(participant4.address)).to.equal(true);

    expect(await daoStaking.getTotalStaked()).to.equal(
      ethers.utils.parseEther("15000")
    );

    expect(await daoStaking.getAvailableReward()).to.equal(
      ethers.utils.parseEther("0")
    );
  });
  it("stakes and unstakes", async function () {
    const { participant1, daoStaking, arweaveps, ric } = await setUp(true);

    await arweaveps.connect(participant1).setPS("participant 1 address");

    await expectRevert(() => daoStaking.connect(participant1).unStake(), "924");

    await mineBlocks(100).then(async () => {
      let PS = new Array(await arweaveps.getAllPS());
      expect(PS[0][0].sharing).to.equal(true);

      expect(await ric.balanceOf(daoStaking.address)).to.equal(
        ethers.utils.parseEther("15000")
      );
      expect(await ric.balanceOf(participant1.address)).to.equal(
        ethers.utils.parseEther("7000")
      );

      expect(await daoStaking.connect(participant1).unStake()).to.emit(
        daoStaking,
        "Unstake"
      );

      expect(await ric.balanceOf(daoStaking.address)).to.equal(
        ethers.utils.parseEther("12000")
      );

      expect(await ric.balanceOf(participant1.address)).to.equal(
        ethers.utils.parseEther("10000")
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
      ethers.utils.parseEther("99957000")
    );
    expect(await ric.balanceOf(daoStaking.address)).to.equal(
      ethers.utils.parseEther("15000")
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
      ethers.utils.parseEther("99956900")
    );
    expect(await ric.balanceOf(daoStaking.address)).to.equal(
      ethers.utils.parseEther("15100")
    );

    expect(
      await daoStaking
        .connect(owner)
        .depositRewards(ethers.utils.parseEther("100"))
    ).to.emit(daoStaking, "RewardDeposit");

    expect(await daoStaking.getAvailableReward()).to.equal(
      ethers.utils.parseEther("200")
    );
    expect(await ric.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("99956800")
    );
    expect(await ric.balanceOf(daoStaking.address)).to.equal(
      ethers.utils.parseEther("15200")
    );

    // I expect claimReward fails here
    await expectRevert(() => daoStaking.connect(owner).claimReward(1), "927");
  });

  it("extend staketime tested", async function () {
    const { owner, participant1, daoStaking, catalogDAO } = await setUp(true);

    await expectRevert(
      () => daoStaking.extendStakeTime(participant1.address),
      "925"
    );

    const stakeDate1 = await daoStaking.getStakeDateFor(participant1.address);
    await catalogDAO.connect(participant1).proposeNewRank("");

    const stakeDate2 = await daoStaking.getStakeDateFor(participant1.address);
    expect(stakeDate2).above(stakeDate1);

    const ownerStakeDate1 = await daoStaking.getStakeDateFor(owner.address);
    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    const ownerStakeDate2 = await daoStaking.getStakeDateFor(owner.address);
    expect(ownerStakeDate2).above(ownerStakeDate1);
  });

  it("penalize access control tested", async function () {
    // Penalize is also tested in the catalogDao
    const { participant1, daoStaking } = await setUp(true);

    await expectRevert(() => daoStaking.penalize(participant1.address), "925");
  });

  it("claims reward, unstakes", async function () {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      participant5,
      daoStaking,
      ric,
    } = await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL2");
    await catalogDAO.connect(participant3).proposeNewRank("repoURL3");
    await catalogDAO.connect(participant4).proposeNewRank("repoURL3");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);
    await catalogDAO.connect(owner).voteOnNewRank(3, true);
    await catalogDAO.connect(owner).voteOnNewRank(4, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);
      await catalogDAO.connect(participant3).closeRankProposal(3);
      await catalogDAO.connect(participant4).closeRankProposal(4);

      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("arweaveTXId1", false, false, false, 0); // Has no fees or front end

      await catalogDAO
        .connect(participant2)
        .proposeNewSmartContract("arweaveTXId2", true, false, false, 0); // has frontend, no fees

      await catalogDAO
        .connect(participant3)
        .proposeNewSmartContract("arweaveTXId3", false, true, false, 0); // has fees only

      await catalogDAO
        .connect(participant4)
        .proposeNewSmartContract("arweaveTXId4", true, true, false, 0); // has both fees and frontend

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true, false);
      await catalogDAO.connect(owner).voteOnNewSmartContract(2, true, false);
      await catalogDAO.connect(owner).voteOnNewSmartContract(3, true, false);
      await catalogDAO.connect(owner).voteOnNewSmartContract(4, true, false);

      await mineBlocks(100).then(async () => {
        await catalogDAO.connect(participant1).closeSmartContractProposal(1);
        await catalogDAO.connect(participant2).closeSmartContractProposal(2);
        await catalogDAO.connect(participant3).closeSmartContractProposal(3);
        await catalogDAO.connect(participant4).closeSmartContractProposal(4);

        // they got all voted in, now I start claiming rewards

        const basicReward = await daoStaking.getActualReward(false, false);
        const frontEndReward = await daoStaking.getActualReward(true, false);
        const hasFeesReward = await daoStaking.getActualReward(false, true);
        const maxReward = await daoStaking.getActualReward(true, true);

        expect(basicReward).equal(ethers.utils.parseEther("3000"));
        expect(frontEndReward).to.equal(ethers.utils.parseEther("6000"));
        expect(hasFeesReward).to.equal(ethers.utils.parseEther("6000"));
        expect(maxReward).to.equal(ethers.utils.parseEther("10000"));

        expect(await daoStaking.getAvailableReward()).to.equal(
          ethers.utils.parseEther("0")
        );

        // Tries to take reward, but not enough available
        await expectRevert(
          () => daoStaking.connect(participant1).claimReward(1),
          "927"
        );

        await ric.approve(
          daoStaking.address,
          ethers.utils.parseEther("100000")
        );

        // owner deposits reward, this is enough for 100 maxRewards
        await expect(
          await daoStaking.depositRewards(ethers.utils.parseEther("100000"))
        ).to.emit(daoStaking, "RewardDeposit");

        expect(await daoStaking.getAvailableReward()).to.equal(
          ethers.utils.parseEther("100000")
        );

        // Tries to take somebody else's reward
        await expectRevert(
          () => daoStaking.connect(participant1).claimReward(2),
          "930"
        );

        await ric.transfer(
          participant5.address,
          ethers.utils.parseEther("10000")
        );
        // A non-staker tries to withdraw
        await expectRevert(
          () => daoStaking.connect(participant5).claimReward(1),
          "919"
        );
        await ric
          .connect(participant5)
          .approve(daoStaking.address, ethers.utils.parseEther("100000"));
        // now he stakes but has no rank
        await daoStaking.connect(participant5).stake();
        await expectRevert(
          () => daoStaking.connect(participant5).claimReward(1),
          "929"
        );

        const balanceOfPar1 = await ric.balanceOf(participant1.address);
        expect(balanceOfPar1).to.equal(parseEther("7000"));
        const balanceOfPar2 = await ric.balanceOf(participant2.address);
        expect(balanceOfPar2).to.equal(parseEther("7000"));
        const balanceOfPar3 = await ric.balanceOf(participant3.address);
        expect(balanceOfPar3).to.equal(parseEther("7000"));

        const balanceOfPar4 = await ric.balanceOf(participant4.address);
        expect(balanceOfPar4).to.equal(parseEther("7000"));

        // takes the reward
        expect(await daoStaking.connect(participant1).claimReward(1)).to.emit(
          daoStaking,
          "ClaimReward"
        );
        expect(await daoStaking.connect(participant2).claimReward(2)).to.emit(
          daoStaking,
          "ClaimReward"
        );
        expect(await daoStaking.connect(participant3).claimReward(3)).to.emit(
          daoStaking,
          "ClaimReward"
        );
        expect(await daoStaking.connect(participant4).claimReward(4)).to.emit(
          daoStaking,
          "ClaimReward"
        );
        // Can't claim twice
        await expectRevert(
          () => daoStaking.connect(participant1).claimReward(1),
          "931"
        );

        const balanceAfterRewardPar1 = await ric.balanceOf(
          participant1.address
        );
        const balanceAfterRewardPar2 = await ric.balanceOf(
          participant2.address
        );
        const balanceAfterRewardPar3 = await ric.balanceOf(
          participant3.address
        );
        const balanceAfterRewardPar4 = await ric.balanceOf(
          participant4.address
        );
        expect(balanceAfterRewardPar1).equal(ethers.utils.parseEther("8500"));
        expect(balanceAfterRewardPar2).equal(ethers.utils.parseEther("10000"));
        expect(balanceAfterRewardPar3).equal(ethers.utils.parseEther("10000"));
        expect(balanceAfterRewardPar4).equal(ethers.utils.parseEther("12000"));

        expect(
          await (
            await daoStaking.getStaker(participant1.address)
          ).stakeAmount
        ).to.equal(parseEther("4500"));
        expect(
          await (
            await daoStaking.getStaker(participant2.address)
          ).stakeAmount
        ).to.equal(parseEther("6000"));
        expect(
          await (
            await daoStaking.getStaker(participant3.address)
          ).stakeAmount
        ).to.equal(parseEther("6000"));
        expect(
          await (
            await daoStaking.getStaker(participant4.address)
          ).stakeAmount
        ).to.equal(parseEther("8000"));
      });
    });
  });
});
