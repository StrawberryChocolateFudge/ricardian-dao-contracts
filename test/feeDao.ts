import { expect } from "chai";
// eslint-disable-next-line node/no-missing-import
import { expectRevert, mineBlocks, parseEther, setUp } from "./setup";

describe("feeDao", () => {
  it("proposes new tokens", async function () {
    const {
      owner,
      participant1,
      feedao,
      ric,
      catalogDAO,
      feetoken1,
      feetoken2,
    } = await setUp(true);

    // I need to give rank to the proposers before they propose

    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(owner).voteOnNewRank(1, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
    });

    let proposals = Array(await feedao.getProposals());
    expect(JSON.stringify(proposals)).to.equal("[[]]");

    expect(await ric.balanceOf(participant1.address)).to.equal(
      parseEther("70")
    );
    // the participant 1 has not enough balance to propose a token
    await expectRevert(
      () =>
        feedao
          .connect(participant1)
          .proposeNewToken(feetoken1.address, "Discussion here", "TOken name"),
      "932"
    );

    await feedao.proposeNewToken(
      feetoken1.address,
      "pickle rick!",
      "TOken name"
    );
    proposals = Array(await feedao.getProposals());
    const addr = proposals[0][0].proposal;
    expect(addr).to.equal(feetoken1.address);

    // the owner voted already because he created the proposal.

    expect(await feedao.votedAlready(0, owner.address)).to.equal(true);
    expect(await feedao.votedAlready(0, participant1.address)).to.equal(false);
    // I drop tokens to participant1 so he can vote
    await ric.transfer(participant1.address, parseEther("1000"));

    await feedao
      .connect(participant1)
      .proposeNewToken(feetoken2.address, "Discussion here", "TOken name");

    // now he voted for that because he created it.
    expect(await feedao.votedAlready(1, participant1.address)).to.equal(true);
  });

  it("votes on proposed tokens", async () => {
    const { catalogDAO, owner, participant1, participant2, feedao, ric } =
      await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);

      await feedao.proposeNewToken(ric.address, "pickle rick!", "TOken name");

      await expectRevert(
        () => feedao.connect(participant1).voteOnToken(0, true),
        "932"
      );

      await ric.transfer(participant1.address, parseEther("1000"));
      await ric.transfer(participant2.address, parseEther("1000"));

      expect(await feedao.connect(participant1).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );

      expect(await feedao.votedAlready(0, participant1.address)).to.equal(true);
      await expectRevert(
        () => feedao.connect(participant1).voteOnToken(0, true),
        "933"
      );
      await expectRevert(() => feedao.closeTokenProposal(0), "915");

      await mineBlocks(10).then(async () => {
        await expectRevert(
          () => feedao.connect(participant1).closeTokenProposal(0),
          "914"
        );

        await expectRevert(
          () => feedao.connect(participant2).voteOnToken(0, true),
          "913"
        );

        expect(await feedao.closeTokenProposal(0)).to.emit(
          feedao,
          "CloseProposal"
        );

        await expectRevert(() => feedao.closeTokenProposal(0), "917");

        const tokens = await feedao.getTokens();

        expect(tokens[0].token).equal(ric.address);
      });
    });
  });
  it("proposes a token that dont get elected", async () => {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,

      feedao,
      ric,
    } = await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);
    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);

      await feedao.proposeNewToken(ric.address, "pickle rick!", "TOken name");

      await expectRevert(
        () => feedao.connect(participant1).voteOnToken(0, true),
        "932"
      );

      await ric.transfer(participant1.address, parseEther("1000"));
      await ric.transfer(participant2.address, parseEther("1000"));

      expect(await feedao.connect(participant1).voteOnToken(0, false)).to.emit(
        feedao,
        "VoteOnToken"
      );

      await mineBlocks(10).then(async () => {
        expect(await feedao.closeTokenProposal(0)).to.emit(
          feedao,
          "CloseProposal"
        );

        const tokens = await feedao.getTokens();
        expect(tokens.length).equal(0);
      });
    });
  });

  it("proposes multiple tokens, some get elected", async () => {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      feedao,
      ric,
    } = await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL");
    await catalogDAO.connect(participant3).proposeNewRank("repoURL");
    await catalogDAO.connect(participant4).proposeNewRank("repoURL");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);
    await catalogDAO.connect(owner).voteOnNewRank(3, true);
    await catalogDAO.connect(owner).voteOnNewRank(4, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);
      await catalogDAO.connect(participant3).closeRankProposal(3);
      await catalogDAO.connect(participant4).closeRankProposal(4);

      await ric.transfer(participant1.address, parseEther("1000"));
      await ric.transfer(participant2.address, parseEther("1000"));
      await ric.transfer(participant3.address, parseEther("1000"));
      await ric.transfer(participant4.address, parseEther("1000"));

      await feedao.proposeNewToken(ric.address, "pickle rick!", "TOken name");
      // VOTED IN
      expect(await feedao.connect(participant1).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );

      expect(await feedao.connect(participant2).voteOnToken(0, false)).to.emit(
        feedao,
        "VoteOnToken"
      );

      expect(await feedao.connect(participant3).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );

      expect(await feedao.connect(participant4).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );

      await mineBlocks(100).then(async () => {
        expect(await feedao.closeTokenProposal(0)).to.emit(
          feedao,
          "CloseProposal"
        );
        // VOTED DOWN
        await feedao.proposeNewToken(
          ric.address,
          "pickle rick1!",
          "TOken name"
        );
        expect(
          await feedao.connect(participant1).voteOnToken(1, false)
        ).to.emit(feedao, "VoteOnToken");

        expect(
          await feedao.connect(participant2).voteOnToken(1, false)
        ).to.emit(feedao, "VoteOnToken");

        expect(
          await feedao.connect(participant3).voteOnToken(1, false)
        ).to.emit(feedao, "VoteOnToken");

        expect(
          await feedao.connect(participant4).voteOnToken(1, false)
        ).to.emit(feedao, "VoteOnToken");

        await mineBlocks(100).then(async () => {
          expect(await feedao.closeTokenProposal(1)).to.emit(
            feedao,
            "CloseProposal"
          );
          // A TIE, SO VOTED NO
          await feedao.proposeNewToken(
            ric.address,
            "pickle rick2!",
            "TOken name"
          );

          expect(
            await feedao.connect(participant1).voteOnToken(2, true)
          ).to.emit(feedao, "VoteOnToken");

          expect(
            await feedao.connect(participant2).voteOnToken(2, true)
          ).to.emit(feedao, "VoteOnToken");

          expect(
            await feedao.connect(participant3).voteOnToken(2, false)
          ).to.emit(feedao, "VoteOnToken");

          expect(
            await feedao.connect(participant4).voteOnToken(2, false)
          ).to.emit(feedao, "VoteOnToken");

          await mineBlocks(100).then(async () => {
            expect(await feedao.closeTokenProposal(2)).to.emit(
              feedao,
              "CloseProposal"
            );
            // VOTED IN
            await feedao.proposeNewToken(
              ric.address,
              "pickle rick3!",
              "TOken name"
            );
            expect(
              await feedao.connect(participant1).voteOnToken(3, true)
            ).to.emit(feedao, "VoteOnToken");

            expect(
              await feedao.connect(participant2).voteOnToken(3, true)
            ).to.emit(feedao, "VoteOnToken");

            expect(
              await feedao.connect(participant3).voteOnToken(3, true)
            ).to.emit(feedao, "VoteOnToken");

            expect(
              await feedao.connect(participant4).voteOnToken(3, false)
            ).to.emit(feedao, "VoteOnToken");

            await mineBlocks(10).then(async () => {
              expect(await feedao.closeTokenProposal(3)).to.emit(
                feedao,
                "CloseProposal"
              );

              const tokens = await feedao.getTokens();
              // 2 tokens got voted in
              expect(tokens.length).equal(2);
            });
          });
        });
      });
    });
  });

  it("makes withdrawal from one voted-in erc20", async () => {
    const {
      catalogDAO,
      owner,
      participant1,
      participant2,
      feedao,
      ric,
      feetoken1,
      ricvault,
    } = await setUp(true);
    await catalogDAO.connect(participant1).proposeNewRank("repoURL");
    await catalogDAO.connect(participant2).proposeNewRank("repoURL");

    await catalogDAO.connect(owner).voteOnNewRank(1, true);
    await catalogDAO.connect(owner).voteOnNewRank(2, true);

    await mineBlocks(100).then(async () => {
      await catalogDAO.connect(participant1).closeRankProposal(1);
      await catalogDAO.connect(participant2).closeRankProposal(2);

      await feedao.proposeNewToken(
        feetoken1.address,
        "pickle rick! discussion here",
        "TOken name"
      );

      await ric.transfer(participant1.address, parseEther("1000"));
      await ric.transfer(participant2.address, parseEther("1000"));

      expect(await feedao.connect(participant1).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );
      expect(await feedao.connect(participant2).voteOnToken(0, true)).to.emit(
        feedao,
        "VoteOnToken"
      );

      await mineBlocks(10).then(async () => {
        expect(await feedao.closeTokenProposal(0)).to.emit(
          feedao,
          "CloseProposal"
        );

        const tokens = await feedao.getTokens();
        expect(tokens.length).equal(1);
        expect(tokens[0].token).to.equal(feetoken1.address);

        // NOW FROM HERE I SHOULD BE ABLE TO CALCULATE WITHDRAW

        // this should be 0 because the feedao has 0 balance
        expect(
          await feedao.calculateWithdraw(tokens[0].token, parseEther("100"))
        ).to.equal(parseEther("0"));
        // Now I transfer it balance
        await feetoken1.transfer(feedao.address, parseEther("10000"));

        // If the participant uses all his balance, it's 1.07
        expect(
          await feedao.calculateWithdraw(
            tokens[0].token,
            await ric.balanceOf(participant1.address)
          )
        ).to.equal(parseEther("0.107"));

        // // Ricvault lockFor should throw because of allowance
        await expectRevert(
          () => feedao.withdrawOne(tokens[0].token, parseEther("100")),
          "exceeds allowance"
        );
        // Approving spend
        await ric
          .connect(participant1)
          .approve(ricvault.address, await ric.balanceOf(participant1.address));

        // // Now the withdraw should succeed
        expect(
          await feedao
            .connect(participant1)
            .withdrawOne(
              tokens[0].token,
              await ric.balanceOf(participant1.address)
            )
        ).to.emit(feedao, "WithdrawToken");
        // Participant1 got the feetoken
        expect(await feetoken1.balanceOf(participant1.address)).to.equal(
          parseEther("0.107")
        );

        expect(await feedao.viewSpentBalanceOf(tokens[0].token)).to.equal(
          parseEther("0.107")
        );
        // Ric balance is zero because the transfer
        expect(await ric.balanceOf(participant1.address)).to.equal(
          parseEther("0")
        );
        // The total locked in the vault is 1070 now, the previous balance of the participant
        expect(await ricvault.getTotalLocked()).to.equal(parseEther("1070"));
        const lockIndex = await ricvault.getLockIndex(participant1.address);
        expect(lockIndex).to.equal(1);

        const vaultContent = await ricvault.getVaultContent(
          participant1.address,
          lockIndex
        );
        // Just making sure the vault has the balance
        expect(vaultContent.lockedAmount).to.equal(parseEther("1070"));
      });
    });
  });

  it("withdraw ETH rewards", async function () {
    const { owner, participant1, participant2, feedao, ric, ricvault } =
      await setUp(true);
    await ric.transfer(participant1.address, parseEther("1000"));
    await ric.transfer(participant2.address, parseEther("1000"));

    expect(await feedao.getTotalBalance()).to.equal(parseEther("0"));
    expect(await feedao.getCurrentBalance()).to.equal(parseEther("0"));
    await expect(
      await owner.sendTransaction({
        to: feedao.address,
        value: parseEther("100"),
      })
    )
      .to.emit(feedao, "Received")
      .withArgs(owner.address, parseEther("100"));

    expect(await feedao.getTotalBalance()).to.equal(parseEther("100"));
    expect(await feedao.getCurrentBalance()).to.equal(parseEther("100"));

    const withdrawAmount = parseEther("1000");

    expect(await feedao.calculateETHWithdraw(withdrawAmount)).to.equal(
      parseEther("0.001")
    );
    await ric.approve(ricvault.address, withdrawAmount);
    expect(await feedao.withdrawETH(withdrawAmount))
      .to.emit(feedao, "WithdrawEth")
      .withArgs(owner.address, parseEther("0.001"), withdrawAmount);
    expect(await feedao.getTotalBalance()).to.equal(parseEther("100"));
    expect(await feedao.getCurrentBalance()).to.equal(parseEther("99.999"));
    expect(await ricvault.getLockIndex(owner.address)).to.equal(1);
    const locked = await ricvault.getVaultContent(owner.address, 1);
    expect(locked.lockedAmount).to.equal(withdrawAmount);

    await expectRevert(
      () => feedao.connect(participant1).withdrawETH(parseEther("1000000000")),
      "934"
    );
  });

  it("only owner can change poll period", async () => {
    const { feedao, participant1 } = await setUp(true);

    await expectRevert(
      () => feedao.connect(participant1).setPollPeriods(1, 2, 3),
      "937"
    );
  });
});
