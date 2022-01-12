import { expect } from "chai";
import { BigNumber } from "ethers";
import {
  setUp,
  expectRevert,
  mineBlocks,
  grindForRank,
  parseEther,
  // eslint-disable-next-line node/no-missing-import
} from "./setup";

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
      .proposeNewSmartContract("arweavetxId", false, false, false, 0);

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
        .proposeNewSmartContract("arweavetxId", false, false, false, 0);

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

        // Only rank 2 users can report other peoples malicious proposals
        await expectRevert(
          () =>
            catalogDAO
              .connect(participant2) // need to be higher than rank 1
              .proposeContractRemoval("Discussion here", 1, true),
          "911"
        );

        // SO I grind the participant2 a little
        await grindForRank(catalogDAO, participant2, owner, 5, "MySCName");

        expect(await catalogDAO.getRank(participant2.address)).to.equal(2);

        await catalogDAO
          .connect(participant2) // need to be higher than rank 1
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
        .proposeNewSmartContract("sc1", false, false, false, 0);
      await catalogDAO
        .connect(participant2)
        .proposeNewSmartContract("sc2", false, false, false, 0);
      await catalogDAO
        .connect(participant3)
        .proposeNewSmartContract("sc3", false, false, false, 0);
      await catalogDAO
        .connect(participant4)
        .proposeNewSmartContract("sc4", false, false, false, 0);

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

        await grindForRank(
          catalogDAO,
          participant1,
          owner,
          5,
          "scproposals"
        ).then(async () => {
          expect(await catalogDAO.getRank(participant1.address)).to.equal(2);

          await grindForRank(
            catalogDAO,
            participant1,
            owner,
            15,
            "scproposals2"
          ).then(async () => {
            expect(await catalogDAO.getRank(participant1.address)).to.equal(3);
            await catalogDAO
              .connect(participant2)
              .proposeNewSmartContract("Sc11", false, false, false, 0);

            let lastPropIndex =
              await catalogDAO.getSmartContractProposalIndex();

            await catalogDAO
              .connect(participant1)
              .voteOnNewSmartContract(lastPropIndex, true, false);
            const lastProposal =
              await catalogDAO.getSmartContractProposalsByIndex(lastPropIndex);

            // Vote weigth is 3 for participant1
            expect(lastProposal.approvals).to.equal(3);

            // NOW I PROPOSE TO REMOVE ONE BECAUSE IT"S MALICIOUS!

            const toRemove = await catalogDAO.getAcceptedSCProposalsByIndex(5);
            expect(toRemove.creator).to.equal(participant1.address);

            await expectRevert(
              () =>
                catalogDAO
                  .connect(participant2)
                  .proposeContractRemoval("discussionURL", 5, true),
              "911"
            ); // Malicious

            await mineBlocks(100).then(async () => {
              lastPropIndex = await catalogDAO.getSmartContractProposalIndex();
              await catalogDAO
                .connect(participant2)
                .closeSmartContractProposal(lastPropIndex);

              await grindForRank(
                catalogDAO,
                participant2,
                owner,
                4,
                "par2"
              ).then(async () => {
                await catalogDAO
                  .connect(participant2)
                  .proposeContractRemoval("discussionURL", 5, true);

                // Proposes a new contract that will not pass because the rank is removed
                await catalogDAO
                  .connect(participant1)
                  .proposeNewSmartContract("sc12", false, false, false, 0);
                lastPropIndex =
                  await catalogDAO.getSmartContractProposalIndex();
                // Even tho the owner votes for it, it will not work because of the remvoval proposal later
                await catalogDAO
                  .connect(owner)
                  .voteOnNewSmartContract(lastPropIndex, true, false);

                await catalogDAO.connect(owner).voteOnRemoval(1, true);
                await expectRevert(
                  () =>
                    catalogDAO.connect(participant1).voteOnRemoval(1, false),
                  "916"
                );
                // made 7 accepted proposals so far with participant1
                expect(
                  await (
                    await catalogDAO.connect(participant1).getMyProposals()
                  ).acceptedSCProposals.length
                ).equal(21);

                let accepted = await catalogDAO.getAllAccepted();
                expect(accepted.length).to.equal(28);
                let removed = await catalogDAO.getAllRemoved();
                expect(removed.length).to.equal(0);

                await mineBlocks(100).then(async () => {
                  const removal1 = await catalogDAO.getRemovalProposalByIndex(
                    1
                  );
                  expect(removal1.approvals).equal(10);
                  expect(removal1.rejections).equal(0);

                  expect(
                    await catalogDAO
                      .connect(participant2)
                      .closeRemovalProposal(1)
                  ).to.emit(daoStaking, "Penalize");

                  // This will close but not pass
                  await expectRevert(
                    () =>
                      catalogDAO
                        .connect(participant1)
                        .closeSmartContractProposal(lastPropIndex),
                    "926"
                  );

                  accepted = await catalogDAO.getAllAccepted();
                  expect(accepted.length).to.equal(28);
                  removed = await catalogDAO.getAllRemoved();
                  expect(removed.length).to.equal(1);

                  // The proposals remain 7
                  expect(
                    await (
                      await catalogDAO.connect(participant1).getMyProposals()
                    ).acceptedSCProposals.length
                  ).equal(21);

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
        .proposeNewSmartContract("sc1", false, false, false, 0);

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

  it("a suspicious smart contract, testing penalize also", async () => {
    const { catalogDAO, owner, participant1, daoStaking } = await setUp(true);

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("sc1", true, true, false, 0); // has frontend and has Fees

      // participant 1 is suspicious

      await catalogDAO.voteOnNewSmartContract(1, false, true);

      await mineBlocks(100).then(async () => {
        expect(await daoStaking.getAvailableReward()).to.equal(0);
        expect(await daoStaking.getTotalStaked()).to.equal(parseEther("150"));

        expect(await catalogDAO.closeSuspiciousProposal(1)).to.emit(
          daoStaking,
          "Penalize"
        );

        const scProposal = await catalogDAO.getSmartContractProposalsByIndex(1);
        expect(scProposal.penalized).to.equal(true);
        expect(scProposal.rejections).to.equal(10);
        expect(scProposal.suspicious).to.equal(10);

        expect(await daoStaking.getTotalStaked()).to.equal(parseEther("120"));
        expect(await daoStaking.getAvailableReward()).to.equal(
          parseEther("30")
        );

        // Suspicious contract was closed by owner and the stake was taken??
        expect(await catalogDAO.getRank(participant1.address)).to.equal(0);

        expect(await daoStaking.isStaking(participant1.address)).to.equal(
          false
        );
      });
    });
  });

  it("Update,updateOf, reward claiming,staking balances, ", async () => {
    const { catalogDAO, owner, participant1, daoStaking, ric } = await setUp(
      true
    );

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO
        .connect(participant1)
        .proposeNewSmartContract("sc1", true, true, false, 0); // has frontend and has Fees

      // participant 1 is suspicious

      await catalogDAO.voteOnNewSmartContract(1, true, false);
      let lastI = await catalogDAO.getSmartContractProposalIndex();
      await mineBlocks(100).then(async () => {
        await catalogDAO
          .connect(participant1)
          .closeSmartContractProposal(lastI);

        const lastAcc = await catalogDAO.getAcceptedSmartContractIndex();
        // Claims the reward for the proposal

        expect(await daoStaking.getTotalStaked()).to.equal(parseEther("150"));
        expect(await daoStaking.getAvailableReward()).equal(parseEther("0"));
        expect(await ric.balanceOf(participant1.address)).to.equal(
          parseEther("70")
        );

        await ric.approve(daoStaking.address, parseEther("10000"));
        await daoStaking.depositRewards(parseEther("10000"));
        await daoStaking.connect(participant1).claimReward(lastAcc);
        expect(await daoStaking.getTotalStaked()).to.equal(parseEther("650"));
        await daoStaking.getStaker(participant1.address);

        expect(
          await (
            await daoStaking.getStaker(participant1.address)
          ).stakeAmount
        ).to.equal(parseEther("530"));

        expect(await ric.balanceOf(participant1.address)).to.equal(
          parseEther("570")
        );

        // NOW AN UPDATE PROPOSAL COMES
        // Faild, need to update a removed contract
        await expectRevert(
          () =>
            catalogDAO
              .connect(participant1)
              .proposeNewSmartContract("sc1 update", true, true, true, lastAcc),
          "952"
        );

        // DO THE CONTRACT REMOVAL

        await catalogDAO
          .connect(participant1)
          .proposeContractRemoval("discussionUrl", lastAcc, false);

        await catalogDAO.voteOnRemoval(1, true);

        await mineBlocks(100).then(async () => {
          await catalogDAO.connect(participant1).closeRemovalProposal(1);
          await catalogDAO
            .connect(participant1)
            .proposeNewSmartContract("sc1 update", true, true, true, lastAcc);

          lastI = await catalogDAO.getSmartContractProposalIndex();
          await catalogDAO.voteOnNewSmartContract(lastI, true, false);

          await mineBlocks(100).then(async () => {
            await catalogDAO
              .connect(participant1)
              .closeSmartContractProposal(lastI);

            // Now for the rewards, the update is NOT getting rewards!
            const lastAcc2 = await catalogDAO.getAcceptedSmartContractIndex();
            await expectRevert(
              () => daoStaking.connect(participant1).claimReward(lastAcc2),
              "953"
            );
          });
        });
      });
    });
  });
  it("testing => banning, should not use this much", async () => {
    const { catalogDAO, owner, participant1, daoStaking, ric } = await setUp(
      true
    );

    expect(await daoStaking.getTotalStaked()).to.equal(parseEther("150"));

    await expectRevert(
      () => catalogDAO.connect(participant1).ban(owner.address),
      "937"
    );

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await ric.approve(daoStaking.address, parseEther("100000"));
    await daoStaking.depositRewards(parseEther("100000"));
    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);

      await grindForRank(catalogDAO, participant1, owner, 20, "asf").then(
        async () => {
          await daoStaking.connect(participant1).claimReward(1);
          await daoStaking.connect(participant1).claimReward(2);
          await daoStaking.connect(participant1).claimReward(3);
          await daoStaking.connect(participant1).claimReward(4);
          await daoStaking.connect(participant1).claimReward(5);
          await daoStaking.connect(participant1).claimReward(6);
          await daoStaking.connect(participant1).claimReward(7);
          await daoStaking.connect(participant1).claimReward(8);
          await daoStaking.connect(participant1).claimReward(9);
          await daoStaking.connect(participant1).claimReward(10);

          expect(await ric.balanceOf(participant1.address)).to.equal(
            parseEther("1570")
          );

          expect(
            await (
              await daoStaking.getStaker(participant1.address)
            ).stakeAmount
          ).to.equal(parseEther("1530"));

          expect(await daoStaking.getTotalStaked()).to.equal(
            parseEther("1650")
          );
          expect(await daoStaking.getAvailableReward()).to.equal(
            parseEther("97000")
          );

          expect(await catalogDAO.ban(participant1.address));
          // // NOW THE PARTICIPANT 1 is fucked, I will never do this
          expect(
            await (
              await daoStaking.getStaker(participant1.address)
            ).stakeAmount
          ).to.equal(parseEther("0"));

          expect(await catalogDAO.getRank(participant1.address)).to.equal(0);

          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("120"));

          expect(await daoStaking.getAvailableReward()).to.equal(
            parseEther("98530")
          );
        }
      );
    });
  });

  it("retire and join again", async () => {
    const { catalogDAO, owner, participant1, daoStaking, ric } = await setUp(
      true
    );
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await ric.approve(daoStaking.address, parseEther("100000"));
    await daoStaking.depositRewards(parseEther("100000"));
    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await grindForRank(catalogDAO, participant1, owner, 5, "asf").then(
        async () => {
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("150"));
          await daoStaking.connect(participant1).claimReward(1);
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("300"));

          await daoStaking.connect(participant1).claimReward(2);
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("450"));

          await daoStaking.connect(participant1).claimReward(3);
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("600"));

          await daoStaking.connect(participant1).claimReward(4);
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("750"));

          await daoStaking.connect(participant1).claimReward(5);
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("900"));

          // NOW THE PARTICIPANT RETIRES AFTER SOME TIME
          expect(await ric.balanceOf(participant1.address)).to.equal(
            parseEther("820")
          );
          expect(await daoStaking.getTotalStaked()).to.equal(parseEther("900"));

          await mineBlocks(100).then(async () => {
            await daoStaking.connect(participant1).unStake();
            expect(await daoStaking.getTotalStaked()).to.equal(
              parseEther("120")
            );
            expect(await ric.balanceOf(participant1.address)).to.equal(
              parseEther("1600")
            );

            expect(await catalogDAO.getRank(participant1.address)).to.equal(1);

            await ric
              .connect(participant1)
              .approve(daoStaking.address, parseEther("30"));
            await daoStaking.connect(participant1).stake();
          });
        }
      );
    });
  });

  it("set poll period", async () => {
    const { catalogDAO, participant1 } = await setUp(true);

    const pollPeriod = await catalogDAO.getPollPeriod();
    expect(pollPeriod).to.equal(100); // testing value

    await expectRevert(
      () => catalogDAO.connect(participant1).setPollPeriod(120),
      "937"
    );

    await catalogDAO.setPollPeriod(120);

    expect(await catalogDAO.getPollPeriod()).to.equal(120);
  });
});
