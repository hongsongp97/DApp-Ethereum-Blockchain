const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

const privKeys = ["18467c395d6aa6fe2cafd1a85aa874d7bf57deab9f681fd00d0bc33acd671cae"]; // private keys
const provider = new HDWalletProvider(privKeys, "HTTP://127.0.0.1:7545");
// const provider = new Web3.providers.HttpProvider("http://localhost:7545")   // Local network by ganache

const web3 = new Web3(provider);
const asciiToHex = Web3.utils.asciiToHex;

const compiledCode = require('../compile/compileVoting'); //Load Smart Contract compiled code 

// Convert contract code to bytecode
const byteCode = compiledCode.bytecode;

// Get contract interface - The json interface for the contract to instantiate
const abiDefinition = JSON.parse(compiledCode.interface);

const candidates = ['Chung', 'Son', 'Nguyen'];

//Deploy smart contract
const deploy = async () => {
    let accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account ' + accounts[0]);
    const VotingContract = await new web3.eth.Contract(abiDefinition).deploy({
        data: '0x' + byteCode,
        arguments: [candidates.map(asciiToHex)]
    }).send({
        from: accounts[0],
        gas: '1000000',
        gasPrice: web3.utils.toWei('20', 'Gwei')
    })
    console.log('Deployed contract successfully!');
    console.log('Contract is deployed at ' + VotingContract.options.address);
}
deploy();