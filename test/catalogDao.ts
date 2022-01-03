import { expect } from "chai";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { setUp, expectRevert, mineBlocks } from "./setup";
import { ethers } from "hardhat";

describe("CatalogDao", function () {
  it("should create the catalogDao and add rank 10 to the deployer", async function () {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
    } = await setUp(true);

    expect(await catalogDAO.getRank(owner.address)).to.equal(10);
    expect(await catalogDAO.getRank(participant1.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant2.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant3.address)).to.equal(0);
    expect(await catalogDAO.getRank(participant4.address)).to.equal(0);
  });

  it("Participant 1 requests rank and the owner will pass it, ", async function () {
    const { catalogDAO, owner, participant1, participant2 } = await setUp(true);

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
    const { catalogDAO, owner, participant1 } = await setUp(true);
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
      .proposeNewSmartContract("arweavetxId", false, false);

    const MYsmartContractProposals = await catalogDAO
      .connect(participant1)
      .getMyProposals();

    expect(await MYsmartContractProposals.smartContract.length).equal(1);

    const mySmartContracts = await MYsmartContractProposals.smartContract;
    const proposedContractindex = mySmartContracts.at(0);
    // // Now I accept the proposal as the owner

    await catalogDAO
      .connect(owner)
      .voteOnNewSmartContract(proposedContractindex as BigNumber, true, false);

    expect(
      await (
        await catalogDAO.getSmartContractProposalsByIndex(
          proposedContractindex as BigNumber
        )
      ).approvals
    ).equals(10);

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
    const { catalogDAO, owner, participant1, participant2 } = await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL2");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);

      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("arweavetxId", false, false);

      await catalogDAO.connect(participant1).getMyProposals();
      const MYsmartContractProposals = await catalogDAO
        .connect(participant1)
        .getMyProposals();

      expect(await MYsmartContractProposals.smartContract.length).equal(1);

      await catalogDAO
        .connect(participant2)
        .voteOnNewSmartContract(1, false, false);

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true, false);

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
      daoStaking,
    } = await setUp(true);
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

      expect(await catalogDAO.getRank(participant1.address)).to.equal(1);
      expect(await catalogDAO.getRank(participant2.address)).to.equal(1);
      expect(await catalogDAO.getRank(participant3.address)).to.equal(1);
      expect(await catalogDAO.getRank(participant4.address)).to.equal(1);

      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("sc1", false, false);
      await catalogDAO
        .connect(participant2)
        .proposeNewSmartContract("sc2", false, false);
      await catalogDAO
        .connect(participant3)
        .proposeNewSmartContract("sc3", false, false);
      await catalogDAO
        .connect(participant4)
        .proposeNewSmartContract("sc4", false, false);

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true, false);

      await catalogDAO
        .connect(participant2)
        .voteOnNewSmartContract(1, true, false);
      await catalogDAO
        .connect(participant3)
        .voteOnNewSmartContract(1, true, false);
      await catalogDAO
        .connect(participant4)
        .voteOnNewSmartContract(1, true, false);

      await catalogDAO.connect(owner).voteOnNewSmartContract(2, true, false);
      await catalogDAO.connect(owner).voteOnNewSmartContract(3, true, false);
      await catalogDAO.connect(owner).voteOnNewSmartContract(4, true, false);

      expect(
        await catalogDAO
          .connect(owner)
          .votedAlreadyOnSmartContract(4, owner.address)
      ).equal(true);

      await mineBlocks(100).then(async () => {
        await catalogDAO.connect(participant1).closeSmartContractProposal(1);
        await catalogDAO.connect(participant2).closeSmartContractProposal(2);
        await catalogDAO.connect(participant3).closeSmartContractProposal(3);
        await catalogDAO.connect(participant4).closeSmartContractProposal(4);

        expect(await catalogDAO.getRank(participant1.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant2.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant3.address)).to.equal(1);
        expect(await catalogDAO.getRank(participant4.address)).to.equal(1);

        await catalogDAO
          .connect(participant1)
          .proposeNewSmartContract("sc5", false, false);

        await catalogDAO.connect(owner).voteOnNewSmartContract(5, true, false);

        await mineBlocks(100).then(async () => {
          await catalogDAO.connect(participant1).closeSmartContractProposal(5);
          await catalogDAO
            .connect(participant1)
            .proposeNewSmartContract("sc6", false, false);

          await catalogDAO
            .connect(owner)
            .voteOnNewSmartContract(6, true, false);

          await mineBlocks(100).then(async () => {
            await catalogDAO
              .connect(participant1)
              .closeSmartContractProposal(6);
            // Rank increased to 2

            expect(await catalogDAO.getRank(participant1.address)).to.equal(2);

            await catalogDAO
              .connect(participant1)
              .proposeNewSmartContract("sc7", false, false);

            await catalogDAO
              .connect(owner)
              .voteOnNewSmartContract(7, true, false);

            await mineBlocks(100).then(async () => {
              await catalogDAO
                .connect(participant1)
                .closeSmartContractProposal(7);

              await catalogDAO
                .connect(participant1)
                .proposeNewSmartContract("sc8", false, false);

              await catalogDAO
                .connect(owner)
                .voteOnNewSmartContract(8, true, false);

              await mineBlocks(100).then(async () => {
                await catalogDAO
                  .connect(participant1)
                  .closeSmartContractProposal(8);

                await catalogDAO
                  .connect(participant1)
                  .proposeNewSmartContract("sc9", false, false);

                await catalogDAO
                  .connect(owner)
                  .voteOnNewSmartContract(9, true, false);

                await mineBlocks(100).then(async () => {
                  await catalogDAO
                    .connect(participant1)
                    .closeSmartContractProposal(9);

                  await catalogDAO
                    .connect(participant1)
                    .proposeNewSmartContract("sc10", false, false);

                  await catalogDAO
                    .connect(owner)
                    .voteOnNewSmartContract(10, true, false);

                  await mineBlocks(100).then(async () => {
                    await catalogDAO
                      .connect(participant1)
                      .closeSmartContractProposal(10);

                    // FINALLY REACHED RANK3!!
                    expect(
                      await catalogDAO.getRank(participant1.address)
                    ).to.equal(3);

                    await catalogDAO
                      .connect(participant2)
                      .proposeNewSmartContract("Sc11", false, false);

                    await catalogDAO
                      .connect(participant1)
                      .voteOnNewSmartContract(11, true, false);
                    const eleven =
                      await catalogDAO.getSmartContractProposalsByIndex(11);

                    // Vote weigth is 3 for participant1
                    expect(eleven.approvals).to.equal(3);

                    // NOW I PROPOSE TO REMOVE ONE BECAUSE IT"S MALICIOUS!

                    const toRemove =
                      await catalogDAO.getAcceptedSCProposalsByIndex(5);
                    expect(toRemove.creator).to.equal(participant1.address);
                    await catalogDAO
                      .connect(participant2)
                      .proposeContractRemoval("discussionURL", 5, true); // Malicious

                    // Proposes a new contract that will not pass because the rank is removed
                    await catalogDAO
                      .connect(participant1)
                      .proposeNewSmartContract("sc12", false, false);

                    // Even tho the owner votes for it, it will not work because of the remvoval proposal
                    await catalogDAO
                      .connect(owner)
                      .voteOnNewSmartContract(12, true, false);

                    await catalogDAO.connect(owner).voteOnRemoval(1, true);
                    await expectRevert(
                      () =>
                        catalogDAO
                          .connect(participant1)
                          .voteOnRemoval(1, false),
                      "916"
                    );
                    // made 7 accepted proposals so far with participant1
                    expect(
                      await (
                        await catalogDAO.connect(participant1).getMyProposals()
                      ).acceptedSCProposals.length
                    ).equal(7);

                    let accepted = await catalogDAO.getAllAccepted();
                    expect(accepted.length).to.equal(10);
                    let removed = await catalogDAO.getAllRemoved();
                    expect(removed.length).to.equal(0);
                    await mineBlocks(100).then(async () => {
                      const removal1 =
                        await catalogDAO.getRemovalProposalByIndex(1);
                      expect(removal1.approvals).equal(10);
                      expect(removal1.rejections).equal(0);

                      expect(
                        await catalogDAO
                          .connect(participant2)
                          .closeRemovalProposal(1)
                      ).to.emit(daoStaking, "Penalize");

                      // This will not close
                      await catalogDAO
                        .connect(participant1)
                        .closeSmartContractProposal(12);

                      accepted = await catalogDAO.getAllAccepted();
                      expect(accepted.length).to.equal(10);
                      removed = await catalogDAO.getAllRemoved();
                      expect(removed.length).to.equal(1);

                      // The proposals remain 7
                      expect(
                        await (
                          await catalogDAO
                            .connect(participant1)
                            .getMyProposals()
                        ).acceptedSCProposals.length
                      ).equal(7);

                      // Participant 1 lost his rank
                      expect(
                        await catalogDAO.getRank(participant1.address)
                      ).to.equal(0);

                      // participant1 lost his stake
                      expect(
                        await daoStaking.isStaking(participant1.address)
                      ).to.equal(false);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it("A smart contract gets voted in, then users express their opinions", async function () {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
    } = await setUp(true);

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("sc1", false, false);

      await catalogDAO.connect(owner).voteOnNewSmartContract(1, true, false);

      await mineBlocks(100).then(async () => {
        await catalogDAO.connect(participant1).closeSmartContractProposal(1);

        await catalogDAO.connect(participant2).expressOpinion(1, true);

        await expectRevert(
          () => catalogDAO.connect(participant2).expressOpinion(1, true),
          "938"
        );
        await catalogDAO.connect(participant1).expressOpinion(1, true);
        await catalogDAO.connect(participant3).expressOpinion(1, false);
        await catalogDAO.connect(participant4).expressOpinion(1, true);
        const acceptedProposals =
          await catalogDAO.getAcceptedSCProposalsByIndex(1);
        expect(acceptedProposals.likes).to.equal(3);
        expect(acceptedProposals.dislikes).to.equal(1);
      });
    });
  });

  it("a suspicious smart contract", async () => {
    const { catalogDAO, owner, participant1, daoStaking } = await setUp(true);

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("sc1", true, true); // has frontend and has Fees

      // participant 1 is suspicious

      await catalogDAO.voteOnNewSmartContract(1, false, true);

      await mineBlocks(100).then(async () => {
        expect(await daoStaking.getAvailableReward()).to.equal(0);
        expect(await daoStaking.getTotalStaked()).to.equal(
          ethers.utils.parseEther("150")
        );

        expect(await catalogDAO.closeSuspiciousProposal(1)).to.emit(
          daoStaking,
          "Penalize"
        );

        const scProposal = await catalogDAO.getSmartContractProposalsByIndex(1);
        expect(scProposal.penalized).to.equal(true);
        expect(scProposal.rejections).to.equal(10);
        expect(scProposal.suspicious).to.equal(10);

        expect(await daoStaking.getTotalStaked()).to.equal(
          ethers.utils.parseEther("120")
        );
        expect(await daoStaking.getAvailableReward()).to.equal(
          ethers.utils.parseEther("30")
        );

        // Suspicious contract was closed by owner and the stake was taken??
        expect(await catalogDAO.getRank(participant1.address)).to.equal(0);

        expect(await daoStaking.isStaking(participant1.address)).to.equal(
          false
        );
      });
    });
  });
});
