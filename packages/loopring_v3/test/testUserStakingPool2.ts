import { Artifacts } from "../util/Artifacts";
import { advanceTimeAndBlockAsync } from "../util/TimeTravel";
import { expectThrow } from "./expectThrow";
import BN = require("bn.js");
const truffleAssert = require("truffle-assertions");
const abi = require("ethereumjs-abi");

contract("UserStakingPool2", (accounts: string[]) => {
  const contracts = new Artifacts(artifacts);
  const MockContract = contracts.MockContract;
  const UserStakingPool = contracts.UserStakingPool;

  const ZERO = new BN(0);

  var mockLRC: any;
  var mockProtocolFeeVault: any;
  var userStakingPool: any;

  var MIN_WITHDRAW_DELAY: number;
  var MIN_CLAIM_DELAY: number;
  const owner = accounts[0];

  before(async () => {
    mockLRC = await MockContract.new();
    mockProtocolFeeVault = await MockContract.new();
    userStakingPool = await UserStakingPool.new(mockLRC.address, {
      from: owner
    });

    MIN_WITHDRAW_DELAY = (await userStakingPool.MIN_WITHDRAW_DELAY()).toNumber();
    MIN_CLAIM_DELAY = (await userStakingPool.MIN_CLAIM_DELAY()).toNumber();

    assert.equal(MIN_WITHDRAW_DELAY, MIN_CLAIM_DELAY, "test assumption failed");
  });

  beforeEach(async () => {
    await mockLRC.reset();
    await mockProtocolFeeVault.reset();
  });

  describe("When protocol fee vault is set", () => {
    const alice = accounts[1];
    const bob = accounts[2];

    it("Alice and bob stake the same amount and split reward", async () => {
      await userStakingPool.setProtocolFeeVault(mockProtocolFeeVault.address, {
        from: owner
      });
      const amount = new BN(web3.utils.toWei("100", "ether"));

      await userStakingPool.stake(amount, { from: alice });
      await userStakingPool.stake(amount, { from: bob });

      await advanceTimeAndBlockAsync(MIN_CLAIM_DELAY - 1);

      // cannot claim yet
      await expectThrow(userStakingPool.claim({ from: alice }), "NEED_TO_WAIT");

      // mocke ProtocolFeeVault to return 500 LRC as total reward
      var totalReward = new BN(web3.utils.toWei("500", "ether"));

      const getProtocolFeeStats = web3.utils
        .sha3("getProtocolFeeStats()")
        .slice(0, 10);

      await mockProtocolFeeVault.givenMethodReturn(
        getProtocolFeeStats,
        abi.rawEncode(
          ["uint", "uint", "uint", "uint", "uint", "uint", "uint", "uint"],
          [0, 0, 0, 0, 0, 0, 0, totalReward]
        )
      );

      await advanceTimeAndBlockAsync(1);

      const tx1 = await userStakingPool.claim({ from: alice });

      truffleAssert.eventEmitted(tx1, "LRCRewarded", (evt: any) => {
        return alice === evt.user && totalReward.div(new BN(2)).eq(evt.amount);
      });

      // then Bob can claim all remaining reward after timeout
      totalReward = totalReward.div(2);

      await mockProtocolFeeVault.givenMethodReturn(
        getProtocolFeeStats,
        abi.rawEncode(
          ["uint", "uint", "uint", "uint", "uint", "uint", "uint", "uint"],
          [0, 0, 0, 0, 0, 0, 0, totalReward]
        )
      );
      const tx2 = await userStakingPool.claim({ from: bob });
      truffleAssert.eventEmitted(tx2, "LRCRewarded", (evt: any) => {
        return bob === evt.user && totalReward.eq(evt.amount);
      });
    });

    // it("can query getUserStaking and get default result", async () => {
    //   const {
    //     0: withdrawalWaitTime,
    //     1: rewardWaitTime,
    //     2: balance,
    //     3: claimableReward
    //   } = await userStakingPool.getUserStaking(alice);

    //   assert(
    //     withdrawalWaitTime.eq(new BN(MIN_WITHDRAW_DELAY)),
    //     "withdrawalWaitTime"
    //   );
    //   assert(rewardWaitTime.eq(new BN(MIN_CLAIM_DELAY)), "rewardWaitTime");
    //   assert(balance.eq(ZERO), "balance");
    //   assert(claimableReward.eq(ZERO), "claimableReward");
    // });
  });
});
