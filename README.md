<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
    <img src="https://user-images.githubusercontent.com/20786863/142437837-97a2954b-baa9-42de-a1ed-254194976765.png" alt="Logo" width="80" height="80">

  <h3 align="center">Crypto Exchange with Solidity</h3>

</div>

<!-- ABOUT THE PROJECT -->
## About The Project

<div>A complete exchange made with solidity.</div>
<div>I made this to learn following a course about solidity and related technologies like web3, truffle, etc</div>

### Built With

* [React.js](https://reactjs.org/)
* [Truffle Framework](https://www.trufflesuite.com/truffle)
* [Ganache](https://www.trufflesuite.com/ganache)
* [Docker](https://www.docker.com/)
* [Chai](https://www.chaijs.com/)

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

To run or contribute to this project you need to have installed docker on your computer

### How to Run

To run:

```
docker-compose up -d
```

<!-- Test Driven Development -->
## Testing

Like every solidity project, it is necessary to test every function you write to ensure that it does not have a bug before going to production.

Tests:</br>
  Contract: Exchange</br>
    deployment</br>
      ✓ tracks the fee account </br>
      ✓ tracks the fee percent </br>
    depositing Ether</br>
      ✓ tracks the Ether deposit</br>
      ✓ emits a Deposit event</br>
    withdraw Ether</br>
      success</br>
        ✓ withdraws Ether funds</br>
        ✓ emits a Withdraw event</br>
      failure</br>
        ✓ rejects withdraws for insufficient funds</br>
    withdraw Token</br>
      success</br>
        ✓ withdraw token funds</br>
        ✓ emits a Withdraw event</br>
      failure</br>
        ✓ reject Ether withdraws</br>
        ✓ fails for insufficient balances</br>
    depositing tokens</br>
      success</br>
        ✓ tracks the token deposit</br>
        ✓ emits a Deposit event</br>
      failure</br>
        ✓ reject Ether deposits</br>
        ✓ fails when no tokens are approved</br>
    checking balances
      ✓ returns user balance</br>
    fallback
      ✓ reverts when Ether is sent</br>
</br>
  Contract: Token</br>
    deployment</br>
      ✓ tracks the name</br>
      ✓ track the symbol</br>
      ✓ track the decimals</br>
      ✓ track the total supply</br>
      ✓ assign the total supply to the deployer</br>
    sending tokens</br>
      success</br>
        ✓ transfers token balances</br>
        ✓ emits a transfer event</br>
      failure</br>
        ✓ rejects insufficient balances</br>
        ✓ rejects invalid recipients</br>
    aproving tokens</br>
      success</br>
        ✓ allocates an allowance for delegated token spending on exchange</br>
        ✓ emits an approval event</br>
      failure</br>
        ✓ rejects invalid spender</br>
    sending tokens</br>
      success</br>
        ✓ transfers token balances</br>
        ✓ reset the allowance</br>
        ✓ emits a transfer event</br>
      failure</br>
        ✓ rejects insufficient amount</br>
        ✓ rejects invalid receiver</br>
        ✓ rejects invalid deployer</br>
