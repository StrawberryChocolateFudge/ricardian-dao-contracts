import { expect } from "chai";
import { BigNumber } from "ethers";
import { setUp, expectRevert, mineBlocks } from "./setup";

describe("CatalogDao", function () {
  it("should create the catalogDao and add rank 10 to the deployer", async function () {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
    } = await setUp();

    expect(await catalogDAO.getRank(owner.address)).to.equal(10);
    expect(await catalogDAO.getRank(participant1.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant2.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant3.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant4.address)).to.equal(0);
  });

  it("Participant 1 requests rank and the owner will pass it, ", async function () {
    const { catalogDAO, owner, participant1, participant2 } = await setUp();
    expect(await catalogDAO.getRankProposalIndex()).to.equal(0);

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");

    const addingRepoTwiceThrows = await expectRevert(
      () => catalogDAO.connect(participant1).proposeNewRank("repoURL"),
      "918"
    );
    expect(addingRepoTwiceThrows.throws).equal(true);
    expect(addingRepoTwiceThrows.correct).equals(true);

    expect(await catalogDAO.getRankProposalIndex()).to.equal(1);
    expect(
      await (
        await catalogDAO.getRankProposalsByIndex(1)
      ).creator
    ).to.equal(participant1.address);

    const participant2Throws = await expectRevert(
      () => catalogDAO.connect(participant2).voteOnNewRank(1, true),
      "911"
    );
    expect(participant2Throws.throws).equal(true);
    expect(participant2Throws.correct).equals(true);

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    expect(
      await (
        await catalogDAO.getRankProposalsByIndex(1)
      ).approvals
    ).equals(10);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
    });

    // The participant 1 got rank YAY!
    expect(await catalogDAO.getRank(participant1.address)).to.equal(1);
  });

  it("Participant 1 proposes a new smart contract and it gets accepted ", async function () {
    const { catalogDAO, owner, participant1 } = await setUp();
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await mineBlocks(100).then(async () => {
      // After a hundred blocks, the withdraw should work
      // Its gonna be 1 million blocks in the live scenario
      await catalogDAO.connect(participant1).closeRankProposal(1);
    });
    // The participant 1 got rank YAY!
    expect(await catalogDAO.getRank(participant1.address)).to.equal(1);

    await catalogDAO
      .connect(participant1)
      .proposeNewSmartContract("arweavetxId");

    const MYsmartContractProposals = await catalogDAO
      .connect(participant1)
      .getMyProposals();

    expect(await MYsmartContractProposals.smartContract.length).equal(1);

    const mySmartContracts = await MYsmartContractProposals.smartContract;
    const proposedContractindex = mySmartContracts.at(0);
    // // Now I accept the proposal as the owner

    await catalogDAO
      .connect(owner)
      .voteOnNewSmartContract(proposedContractindex as BigNumber, true);

    expect(
      await (
        await catalogDAO.getSmartContractProposalsByIndex(
          proposedContractindex as BigNumber
        )
      ).approvals
    ).equals(11);

    await mineBlocks(100).then(async () => {
      await catalogDAO
        .connect(participant1)
        .closeSmartContractProposal(proposedContractindex as BigNumber);

      const proposalAlreadyClosed = await expectRevert(
        () =>
          catalogDAO
            .connect(participant1)
            .closeSmartContractProposal(proposedContractindex as BigNumber),
        "917"
      );
      expect(proposalAlreadyClosed.throws).equal(true);
      expect(proposalAlreadyClosed.correct).equals(true);
    });

    expect(await catalogDAO.getAcceptedSmartContractIndex()).equal(1);
  });

  it("Participant proposes a smart contract that gets voted in then later removed", async function () {
    const { catalogDAO, owner, participant1, participant2 } = await setUp();
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL2");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);

      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("arweavetxId");

      await catalogDAO.connect(participant1).getMyProposals();
      const MYsmartContractProposals = await catalogDAO
        .connect(participant1)
        .getMyProposals();

      expect(await MYsmartContractProposals.smartContract.length).equal(1);

      await catalogDAO.connect(participant2).voteOnNewSmartContract(1, false);

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true);

      await mineBlocks(100).then(async () => {
        await catalogDAO.connect(participant1).closeSmartContractProposal(1);
        // Participant says it's malicious, maybe thats why he voted agains it?
        await catalogDAO
          .connect(participant2)
          .proposeContractRemoval("Discussion here", 1, true);
        // Owner votes, yes remove it.

        await catalogDAO.connect(owner).voteOnRemoval(1, true);

        await mineBlocks(100).then(async () => {
          await catalogDAO.connect(participant2).closeRemovalProposal(1);
          const acceptedProposals =
            await catalogDAO.getAcceptedSCProposalsByIndex(1);
          expect(acceptedProposals.removed).equal(true);
          expect(await catalogDAO.getRank(participant1.address)).to.equal(0);
        });
      });
    });
  });

  it("participants get rank increase and vote alone", async () => {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
    } = await setUp();
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL2");
    await catalogDAO.connect(participant3).proposeNewRank("repoURL3");
    await catalogDAO.connect(participant4).proposeNewRank("repoURL4");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);
    await catalogDAO.connect(owner).voteOnNewRank(3, true);
    await catalogDAO.connect(owner).voteOnNewRank(4, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);
      await catalogDAO.connect(participant3).closeRankProposal(3);
      await catalogDAO.connect(participant4).closeRankProposal(4);

      await catalogDAO.connect(participant1).proposeNewSmartContract("sc1");
      await catalogDAO.connect(participant2).proposeNewSmartContract("sc2");
      await catalogDAO.connect(participant3).proposeNewSmartContract("sc3");
      await catalogDAO.connect(participant4).proposeNewSmartContract("sc4");
      await catalogDAO.connect(participant4).proposeNewSmartContract("sc5");
      await catalogDAO.connect(participant4).proposeNewSmartContract("sc6");
      await catalogDAO.connect(participant4).proposeNewSmartContract("sc7");
      await catalogDAO.connect(participant4).proposeNewSmartContract("sc8");

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true);
      await catalogDAO.connect(participant2).voteOnNewSmartContract(1, true);
      await catalogDAO.connect(participant3).voteOnNewSmartContract(1, true);
      await catalogDAO.connect(participant4).voteOnNewSmartContract(1, true);

      await catalogDAO.connect(owner).voteOnNewSmartContract(2, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(3, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(4, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(5, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(6, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(7, true);
      await catalogDAO.connect(owner).voteOnNewSmartContract(8, true);

      expect(
        await catalogDAO
          .connect(owner)
          .votedAlreadyOnSmartContract(8, owner.address)
      ).equal(true);

      await mineBlocks(100).then(async () => {
        await catalogDAO.connect(participant1).closeSmartContractProposal(1);
        await catalogDAO.connect(participant2).closeSmartContractProposal(2);
        await catalogDAO.connect(participant3).closeSmartContractProposal(3);
        await catalogDAO.connect(participant4).closeSmartContractProposal(4);
        await catalogDAO.connect(participant4).closeSmartContractProposal(5);
        await catalogDAO.connect(participant4).closeSmartContractProposal(6);
        await catalogDAO.connect(participant4).closeSmartContractProposal(7);
        await catalogDAO.connect(participant4).closeSmartContractProposal(8);

        expect(await catalogDAO.getRank(participant1.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant2.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant3.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant4.address)).to.equal(2);

        await catalogDAO.connect(participant4).proposeNewSmartContract("sc9");
        await catalogDAO.connect(participant1).proposeNewSmartContract("sc10");
        await catalogDAO.connect(participant1).proposeNewSmartContract("sc11");
        await catalogDAO.connect(participant1).proposeNewSmartContract("sc12");
        await catalogDAO.connect(owner).voteOnNewSmartContract(9, true);
        await catalogDAO.connect(owner).voteOnNewSmartContract(10, true);
        await catalogDAO.connect(owner).voteOnNewSmartContract(11, true);
        await catalogDAO.connect(owner).voteOnNewSmartContract(12, true);

        // send a removal proposal for one

        await catalogDAO
          .connect(participant2)
          .proposeContractRemoval("discussionURL", 1, true);

        await catalogDAO.connect(owner).voteOnRemoval(1, true);

        await mineBlocks(100).then(async () => {
          expect(
            await catalogDAO.connect(participant1).getRank(participant1.address)
          ).to.equal(1);

          await catalogDAO.connect(participant2).closeRemovalProposal(1);

          expect(
            await catalogDAO.connect(participant1).getRank(participant1.address)
          ).to.equal(0);

          await catalogDAO.connect(participant4).closeSmartContractProposal(9);

          // Because the participant1's rank was removed, these will not pass
          await catalogDAO.connect(participant1).closeSmartContractProposal(10);
          await catalogDAO.connect(participant1).closeSmartContractProposal(11);
          await catalogDAO.connect(participant1).closeSmartContractProposal(12);

          expect(
            await catalogDAO.connect(participant1).getRank(participant1.address)
          ).to.equal(0);

          expect(
            await (
              await catalogDAO.connect(participant1).getMyProposals()
            ).acceptedSCProposals.length
          ).equal(1);

          expect(
            await (
              await catalogDAO.connect(participant4).getMyProposals()
            ).acceptedSCProposals.length
          ).equal(6);

          expect(
            await catalogDAO.connect(participant4).getRank(participant4.address)
          ).equals(3);
        });
      });
    });
  });
});
