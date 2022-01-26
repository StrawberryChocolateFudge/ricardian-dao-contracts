import { expect } from "chai";
import {
  setUp,
  expectRevert,
  // eslint-disable-next-line node/no-missing-import
} from "./setup";

describe("Trail tests", () => {
  it("Registers a new trail,adds to it, removes, blacklist", async () => {
    const { trails, owner, participant1 } = await setUp(false);
    const myTrailName = "MyTrailName";
    const TXID = "cGU3w4SlEESxajw-t_mhoBArT7WTwmac1mvjlBqNIi0";
    expect(await trails.newTrail(myTrailName, 0))
      .to.emit(trails, "NewTrails")
      .withArgs(myTrailName, owner.address);

    expect(await trails.add(myTrailName, TXID))
      .to.emit(trails, "Add")
      .withArgs(myTrailName, owner.address, TXID);

    const trailDetail = await trails.getTrailDetails(myTrailName);

    expect(await trailDetail.creator).to.equal(owner.address);
    expect(await trailDetail.contentIndex).to.equal(1);
    expect(await trailDetail.initialized).to.equal(true);
    expect(await trailDetail.access).to.equal(0);

    expect(await trails.getTrailContent(myTrailName, 1)).to.equal(TXID);

    const dontExist = await trails.getTrailDetails("DOESNTEXIST");
    expect(await dontExist.initialized).to.equal(false);

    await expectRevert(
      () =>
        trails
          .connect(participant1)
          .add("something", "D14v43FYaapOuACHKErekxYk41mK5wjzN7qNCBQuFxQ"),
      "957"
    );

    await expectRevert(
      () =>
        trails
          .connect(participant1)
          .add(myTrailName, "D14v43FYaapOuACHKErekxYk41mK5wjzN7qNCBQuFxQ"),
      "958"
    );
    await expectRevert(
      () =>
        trails.add(
          myTrailName,
          "D14v43FYaapOuACHKErekxYk41mK5wjzN7qNCBQuFxQasfasf"
        ),
      "959"
    );

    expect(await trails.remove(myTrailName, 1)).to.emit(trails, "Remove");
    expect(await trails.getTrailContent(myTrailName, 1)).to.equal("");
  });
});
