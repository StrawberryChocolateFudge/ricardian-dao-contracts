import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { DaoStaking, Ric } from "../typechain";
// eslint-disable-next-line node/no-missing-import
import { approveSpend, dropTokens, setUp } from "./setup";

describe("Ric token", async function () {
  it("Should have correct Ric balances", async function () {
    const {
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      ric,
    }: {
      owner: SignerWithAddress;
      participant1: SignerWithAddress;
      participant2: SignerWithAddress;
      participant3: SignerWithAddress;
      participant4: SignerWithAddress;
      ric: Ric;
    } = await setUp(false);

    expect(await ric.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("100000000")
    );

    expect(await ric.balanceOf(participant1.address)).to.equal(
      ethers.utils.parseEther("0")
    );

    await dropTokens(
      ric,
      owner,
      participant1,
      participant2,
      participant3,
      participant4
    );

    expect(await ric.balanceOf(participant1.address)).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await ric.balanceOf(participant2.address)).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await ric.balanceOf(participant3.address)).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await ric.balanceOf(participant4.address)).to.equal(
      ethers.utils.parseEther("100")
    );

    expect(
      await ric.connect(participant1).burn(ethers.utils.parseEther("10"))
    ).to.emit(ric, "Burn");

    expect(await ric.balanceOf(participant1.address)).to.eq(
      ethers.utils.parseEther("90")
    );

    expect(await ric.totalSupply()).to.equal(
      ethers.utils.parseEther("99999990")
    );
  });

  it("approves spend for the daoStaking", async function () {
    const {
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      ric,
      daoStaking,
    }: {
      owner: SignerWithAddress;
      participant1: SignerWithAddress;
      participant2: SignerWithAddress;
      participant3: SignerWithAddress;
      participant4: SignerWithAddress;
      ric: Ric;
      daoStaking: DaoStaking;
    } = await setUp(false);
    expect(await ric.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("100000000")
    );

    expect(await ric.balanceOf(participant1.address)).to.equal(
      ethers.utils.parseEther("0")
    );

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

    expect(
      await ric.allowance(participant1.address, daoStaking.address)
    ).to.equal(ethers.utils.parseEther("30"));
  });
});
