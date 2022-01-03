import { expect } from "chai";
// eslint-disable-next-line node/no-missing-import
import { expectRevert, setUp } from "./setup";

describe("ArweavePS", async function () {
  it("sets a PS address, stops PS, staking error check ", async () => {
    const { owner, arweaveps } = await setUp(true);

    expect(
      await arweaveps.connect(owner).setPS("Owner arweave address")
    ).to.emit(arweaveps, "SetPS");

    const PS = await arweaveps.getAllPS();
    expect(new Array(PS).length).to.equal(1);

    expect(await arweaveps.connect(owner).stopPS()).to.emit(
      arweaveps,
      "StopPS"
    );

    await expectRevert(() => arweaveps.stoppedStaking(owner.address), "920");
  });
});
