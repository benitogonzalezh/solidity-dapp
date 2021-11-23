import { before } from "lodash";
import { ETHER_ADDRESS, EVM_REVERT, tokens, ether } from "./helpers";
const Exchange = artifacts.require("./Exchange");
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token, exchange;
  const feePercent = 10;

  beforeEach(async () => {
    //Deploy token
    token = await Token.new();
    //Transfer some tokens to user1
    token.transfer(user1, tokens(100), { from: deployer });
    //Deploy exchange
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });
    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercent.toString());
    });
  });

  describe("depositing Ether", async () => {
    let result, amount;

    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it("tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });
    it("emits a Deposit event", async () => {
      const log = result.logs[0];
      log.event.should.eq("Deposit");
      const event = log.args;
      event.token.should.equal(ETHER_ADDRESS, "token address is correct");
      event.user.should.equal(user1, "user address is correct");
      event.amount.toString().should.equal(amount.toString());
      event.balance.toString().should.equal(amount.toString());
    });
  });

  describe("withdraw Ether", async () => {
    let result, amount;

    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", async () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
      });
      it("withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });
      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        event.token.should.equal(ETHER_ADDRESS, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString());
        event.balance.toString().should.equal("0");
      });
    });
    describe("failure", async () => {
      it("rejects withdraws for insufficient funds", async () => {
        await exchange
          .withdrawEther(ether(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdraw Token", async () => {
    let result, amount;

    describe("success", async () => {
      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, { from: user1 });

        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });
      it("withdraw token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });
      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Withdraw");
        const event = log.args;
        event.token.should.equal(token.address, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString());
        event.balance.toString().should.equal("0");
      });
    });
    describe("failure", async () => {
      it("reject Ether withdraws", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("fails for insufficient balances", async () => {
        await exchange
          .withdrawToken(token.address, tokens(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("depositing tokens", () => {
    let result, amount;

    beforeEach(async () => {
      amount = tokens(10);
      await token.approve(exchange.address, amount, { from: user1 });
      result = await exchange.depositToken(token.address, amount, {
        from: user1,
      });
    });

    describe("success", () => {
      it("tracks the token deposit", async () => {
        let balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });
      it("emits a Deposit event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Deposit");
        const event = log.args;
        event.token.should.equal(token.address, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString());
        event.balance.toString().should.equal(amount.toString());
      });
    });
    describe("failure", () => {
      it("reject Ether deposits", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("fails when no tokens are approved", async () => {
        await exchange
          .depositToken(token.address, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("checking balances", () => {
    beforeEach(async () => {
      exchange.depositEther({ from: user1, value: ether(1) });
    });
    it("returns user balance", async () => {
      const balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
      balance.toString().should.equal(ether(1).toString());
    });
  });

  describe("fallback", () => {
    it("reverts when Ether is sent", async () => {
      await exchange
        .sendTransaction(ether(1))
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("making orders", async () => {
    let result;

    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    it("tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount();
      orderCount.toString().should.equal("1");
      const order = await exchange.orders("1");
      order.id.toString().should.equal("1", "id is correct");
      order.user.should.equal(user1, "user is correct");
      order.tokenGet.should.equal(token.address, "tokenGet is correct");
      order.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet is correct");
      order.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      order.amountGive
        .toString()
        .should.equal(ether(1).toString(), "amountGive is correct");
      order.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is correct");
    });

    it("emits an 'Order' event", async () => {
      const log = result.logs[0];
      log.event.should.eq("Order");
      const event = log.args;
      event.id.toString().should.equal("1", "id is correct");
      event.user.should.equal(user1, "user is correct");
      event.tokenGet.should.equal(token.address, "tokenGet is correct");
      event.amountGet
        .toString()
        .should.equal(tokens(1).toString(), "amountGet is correct");
      event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
      event.amountGive
        .toString()
        .should.equal(ether(1).toString(), "amountGive is correct");
      event.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is correct");
    });
  });

  describe("order actions", async () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
      await token.transfer(user2, tokens(100), { from: deployer });
      await token.approve(exchange.address, tokens(2), { from: user2 });
      await exchange.depositToken(token.address, tokens(2), { from: user2 });
      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      );
    });

    describe("filling orders", async () => {
      let result;

      describe("success", async () => {
        beforeEach(async () => {
          result = await exchange.fillOrder(1, { from: user2 });
        });

        it("executes the trade & charges fees", async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1);
          balance
            .toString()
            .should.equal(tokens(1).toString(), "user1 received tokens");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
          balance
            .toString()
            .should.equal(ether(1).toString(), "user2 received ether");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
          balance
            .toString()
            .should.equal(ether(0).toString(), "user1 ether balance is 0");
          balance = await exchange.balanceOf(token.address, user2);
          balance
            .toString()
            .should.equal(
              tokens(0.9).toString(),
              "user2 tokens deducted with fee applied"
            );
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance
            .toString()
            .should.equal(tokens(0.1).toString(), "feeAccount received fee");
        });

        it("updates filled orders", async () => {
          const orderFilled = await exchange.orderFilled(1);
          orderFilled.should.equal(true);
        });
        it("emits a 'Trade' event", async () => {
          const log = result.logs[0];
          log.event.should.eq("Trade");
          const event = log.args;
          event.id.toString().should.equal("1", "id is correct");
          event.user.should.equal(user1, "user is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive
            .toString()
            .should.equal(ether(1).toString(), "amountGive is correct");
          event.userFill.should.equal(user2, "userFill is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is correct");
        });
      });
      describe('failure', async () => {
        it("rejects invalid orders ids", async () => {
          const invalidOrderId = 9999;
          await exchange.fillOrder(invalidOrderId, { from: user2 }).should.be.rejectedWith(EVM_REVERT);
        })
        it('rejects already-filled orders', async ()=>{
          await exchange.fillOrder(1, {from: user2}).should.be.fulfilled;
          await exchange.fillOrder(1, {from: user2}).should.be.rejectedWith(EVM_REVERT);
        });
        it('rejects cancelled orders', async () => {
          await exchange.cancelOrder(1, {from: user1}).should.be.fulfilled;
          await exchange.fillOrder(1, {from: user2}).should.be.rejectedWith(EVM_REVERT);
        })
      });
    });

    describe("cancelling orders", async () => {
      let result;

      describe("success", async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("updates cancelled orders", async () => {
          const orderCancelled = await exchange.orderCancelled(1);
          orderCancelled.should.equal(true);
        });

        it("emits a 'Cancel' event", async () => {
          const log = result.logs[0];
          log.event.should.eq("Cancel");
          const event = log.args;
          event.id.toString().should.equal("1", "id is correct");
          event.user.should.equal(user1, "user is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet
            .toString()
            .should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive
            .toString()
            .should.equal(ether(1).toString(), "amountGive is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is correct");
        });
      });
      describe("failure", async () => {
        it("reject invalid order ids", async () => {
          const invalidOrderId = 100000;
          await exchange
            .cancelOrder(invalidOrderId, { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });
        it("rejects unauthorized cancelations", async () => {
          await exchange
            .cancelOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});
