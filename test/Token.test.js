import { EVM_REVERT, tokens } from "./helpers";
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployer, receiver, exchange]) => {
  const name = "DApp Token";
  const symbol = "DAPP";
  const decimals = "18";
  const totalSupply = tokens(1000000).toString();
  let token;

  beforeEach(async () => {
    token = await Token.new();
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      //Fetch token from blockchain
      //Read token name here...
      //The token name is 'Token'
      const result = await token.name();
      result.should.equal(name);
    });

    it("track the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });
    it("track the decimals", async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals);
    });
    it("track the total supply", async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply.toString());
    });
    it("assign the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply.toString());
    });
  });
  describe("sending tokens", () => {
    let amount, result;
    describe("success", () => {
      beforeEach(async () => {
        //Transfer
        amount = tokens(100);
        result = await token.transfer(receiver, amount, { from: deployer });
      });
      it("transfers token balances", async () => {
        let balanceOf;
        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(999900).toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(100).toString());
      });
      it("emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Transfer");
        const event = log.args;
        event.from.should.eq(deployer);
        event.to.should.eq(receiver);
        event.value.toString().should.eq(amount.toString());
      });
    });
    describe("failure", () => {
      it("rejects insufficient balances", async () => {
        let invalidamount;
        invalidamount = tokens(100000000); //100 Million - greather than total supply
        await token
          .transfer(receiver, invalidamount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        invalidamount = tokens(10); //100 Million - greather than total supply
        await token
          .transfer(deployer, invalidamount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("rejects invalid recipients", async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });
  describe("aproving tokens", () => {
    let result, amount;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      it("allocates an allowance for delegated token spending on exchange", async () => {
        let allowance;
        allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(amount.toString());
      });
      it("emits an approval event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Approval");
        const event = log.args;
        event.owner.should.eq(deployer, "owner is correct");
        event.spender.should.eq(exchange, "spender is correct");
        event.value.toString().should.eq(amount.toString(), "value is correct");
      });
    });
    describe("failure", () => {
      it("rejects invalid spender", async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });
  describe("sending tokens", () => {
    let amount, result;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transferFrom(deployer ,receiver, amount, { from: exchange });
      });
      it("transfers token balances", async () => {
        let balanceOf;
        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(999900).toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(100).toString());
      });
      it('reset the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal('0');
      })
      it("emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.eq("Transfer");
        const event = log.args;
        event.from.should.eq(deployer);
        event.to.should.eq(receiver);
        event.value.toString().should.eq(amount.toString());
      });
    });
    describe("failure", () => {
      it("rejects insufficient amount", async () => {
        await token.transferFrom(deployer, receiver, tokens(100000000), {
          from: exchange
        }).should.be.rejectedWith(EVM_REVERT);
      });
      it("rejects invalid receiver", async () => {
        await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be
          .rejected;
      });
      it("rejects invalid deployer", async () => {
        await token.transferFrom(0x0, receiver, amount, { from: exchange }).should.be
          .rejected;
      });
    });
  });
});
