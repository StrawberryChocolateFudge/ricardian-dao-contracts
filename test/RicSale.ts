import { expect } from "chai";
// eslint-disable-next-line node/no-missing-import
import { expectRevert, parseEther, setUp } from "./setup";

describe("RicSale", async function () {
  it("Tokensale", async () => {
    const {
      owner,
      participant1,
      participant2,
      participant3,
      participant4,
      participant5,
      ricsale,
      ric,
      buyer1,
      buyer2,
      buyer3,
      buyer4,
      buyer5,
      buyer6,
      buyer7,
      buyer8,
      buyer9,
      buyer10,
      buyer11,
      buyer12,
      buyer13,
      buyer14,
      daoStaking,
    } = await setUp(true);
    // I transfer away the tokens, the address will have only 40.000.000 tokens in the wallet for the sale
    await ric.approve(daoStaking.address, parseEther("100000000"));
    expect(await ric.balanceOf(owner.address)).to.equal(parseEther("99999570"));
    await daoStaking.depositRewards(parseEther("59999570"));
    expect(await ric.balanceOf(owner.address)).to.equal(parseEther("40000000"));

    await ric.approve(ricsale.address, parseEther("40000000"));
    expect(await ricsale.remainingTokens()).to.equal(parseEther("40000000"));

    expect(await ric.balanceOf(participant1.address)).to.equal(
      parseEther("70")
    );
    let tokensSold = await ricsale.getTokensSold();
    expect(tokensSold).to.equal(0);
    expect(await ricsale.getCurrentRate(tokensSold)).to.equal(100);

    expect(await ric.balanceOf(owner.address)).to.equal(parseEther("40000000"));

    let overrides = { value: parseEther("1000") };
    await ricsale.connect(participant1).buyTokens(overrides);

    expect(await ric.balanceOf(participant1.address)).to.equal(
      parseEther("100070")
    );
    expect(await ric.balanceOf(owner.address)).to.equal(parseEther("39900000"));
    // Cant buy more than 100.000 Ric / rate
    overrides = { value: parseEther("1001") };
    await expectRevert(
      () => ricsale.connect(participant2).buyTokens(overrides),
      "950"
    );
    expect(await ric.balanceOf(participant2.address)).to.equal(
      parseEther("70")
    );

    overrides = { value: parseEther("1000") };
    await ricsale.connect(participant2).buyTokens(overrides);

    expect(await ric.balanceOf(participant2.address)).to.equal(
      parseEther("100070")
    );
    overrides = { value: parseEther("1") };
    await expectRevert(
      () => ricsale.connect(participant2).buyTokens(overrides),
      "951"
    );
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer1).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer2).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer3).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer4).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer5).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer6).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer7).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer8).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer9).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer10).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer11).buyTokens(overrides);

    tokensSold = await ricsale.getTokensSold();
    expect(tokensSold).to.equal(parseEther("1300000"));
    expect(await ric.balanceOf(owner.address)).to.equal(parseEther("38700000"));
    expect(await ricsale.getCurrentRate(parseEther("1000000"))).to.equal(100);
    expect(await ricsale.getCurrentRate(parseEther("2000000"))).to.equal(90);
    expect(await ricsale.getCurrentRate(parseEther("4000000"))).to.equal(80);
    expect(await ricsale.getCurrentRate(parseEther("4000311"))).to.equal(80);
    expect(await ricsale.getCurrentRate(parseEther("6000000"))).to.equal(70);
    expect(await ricsale.getCurrentRate(parseEther("8000000"))).to.equal(60);
    expect(await ricsale.getCurrentRate(parseEther("9999999"))).to.equal(60);
    expect(await ricsale.getCurrentRate(parseEther("10000000"))).to.equal(50);
    expect(await ricsale.getCurrentRate(parseEther("12000000"))).to.equal(40);
    expect(await ricsale.getCurrentRate(parseEther("14000000"))).to.equal(30);
    expect(await ricsale.getCurrentRate(parseEther("16000000"))).to.equal(20);
    expect(await ricsale.getCurrentRate(parseEther("18000000"))).to.equal(10);
    expect(await ricsale.getCurrentRate(parseEther("20000000"))).to.equal(9);
    expect(await ricsale.getCurrentRate(parseEther("22000000"))).to.equal(8);
    expect(await ricsale.getCurrentRate(parseEther("24000000"))).to.equal(7);
    expect(await ricsale.getCurrentRate(parseEther("26000000"))).to.equal(6);
    expect(await ricsale.getCurrentRate(parseEther("28000000"))).to.equal(5);
    expect(await ricsale.getCurrentRate(parseEther("30000000"))).to.equal(4);
    expect(await ricsale.getCurrentRate(parseEther("32000000"))).to.equal(3);
    expect(await ricsale.getCurrentRate(parseEther("34000000"))).to.equal(2);
    expect(await ricsale.getCurrentRate(parseEther("36000000"))).to.equal(1);
    expect(await ricsale.getCurrentRate(parseEther("38000000"))).to.equal(1);
    expect(await ricsale.getCurrentRate(parseEther("40000000"))).to.equal(1);

    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer12).buyTokens(overrides);
    tokensSold = await ricsale.getTokensSold();
    expect(tokensSold).to.equal(parseEther("1400000"));
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer13).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(buyer14).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(participant3).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(participant4).buyTokens(overrides);
    overrides = { value: parseEther("1000") };
    await ricsale.connect(participant5).buyTokens(overrides);
    overrides = { value: parseEther("1000") };

    tokensSold = await ricsale.getTokensSold();
    expect(tokensSold).to.equal(parseEther("1900000"));

    await ricsale.buyTokens(overrides);
    tokensSold = await ricsale.getTokensSold();
    expect(tokensSold).to.equal(parseEther("2000000"));

    expect(await ricsale.getCurrentRate(tokensSold)).to.equal(90);
    expect(await ricsale.remainingTokens()).to.equal(parseEther("38000000"));

    expect(await ric.balanceOf(participant1.address)).to.equal(
      parseEther("100070")
    );

    await expect(
      await participant1.sendTransaction({
        to: ricsale.address,
        value: parseEther("100"),
      })
    ).to.emit(ricsale, "TokensPurchased");

    expect(await ric.balanceOf(participant1.address)).to.equal(
      parseEther("109070")
    );
  });
});
