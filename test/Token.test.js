import { EVM_REVERT, tokens } from "./helpers";
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployer, receiver]) => {
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
        await token
          .transfer(0x0, amount, { from: deployer })
          .should.be.rejected;
      });
    });
  });
});
