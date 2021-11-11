require("babel-register");
require("babel-polyfill");
require("dotenv").config();

module.exports = {
  networks: {
    development: {
      host: "ganache",
      port: 8545,
      network_id: "*",
    },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  compilers: {
    solc: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
    },
  },
};
