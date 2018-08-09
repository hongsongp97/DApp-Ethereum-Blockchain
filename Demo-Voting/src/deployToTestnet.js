const Web3 = require('web3');
// const HDWalletProvider = require('truffle-hdwallet-provider');
// const provider = new HDWalletProvider(
//     'income orchard else soldier spot dog eight business bulb obey swear budget',
//     'https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc'
// );

const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privKeys = ["4c54f0453dc294005ba7c38944e84074c9e69399d06f8f60109de627fc678fdd"]; // private keys
const provider = new HDWalletProvider(privKeys, "https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc");

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