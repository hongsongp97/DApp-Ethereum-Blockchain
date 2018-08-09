const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc');

const provider = new Web3.providers.HttpProvider("http://localhost:7545")
// const provider = new Web3.providers.HttpProvider("http://deto3j-dns-reg1.southeastasia.cloudapp.azure.com:8545/")
const web3 = new Web3(provider);
const asciiToHex = Web3.utils.asciiToHex;

const candidates = ['Chung', 'Son', 'Nguyen'];

console.log(candidates.map(asciiToHex));

web3.eth.getAccounts()
  .then((accounts) => {
    console.log('accounts:\n', accounts);

    var balance = web3.eth.getBalance('0xeB645a12645223FCf554f8B73F1D235d740C3215');
    balance.then((value) => {
      console.log('balance: ' + value);
    });

    var info = web3.eth.getBlock(6396)
      .then((value) => {
        console.log('Block 6396:');
        console.log(value);
        var transCount = web3.eth.getBlockTransactionCount(6396)
          .then((value) => {

            console.log('trans count: ' + value);

            var transaction = web3.eth.getTransaction('0x1b4c36ba5b7e5e0520c4f5dd9402c79ec28af86a57cd4fe68df5ec46ae93111d')
              .then((trans) => {
                console.log('tx in block 6396:')
                console.log(trans);
              })
              .catch(err => {
                console.log(err);
              })

            var uncle = web3.eth.getUncle(6396, 0, true)
              .then((value) => {
                console.log('uncle:\n' + value);
              })
          })
          .catch((err) => {
            console.log(err);
          })
          .catch(err => {
            console.log(err);
          })
      })
      .catch((err) => {
        console.log(err);
      })
  });