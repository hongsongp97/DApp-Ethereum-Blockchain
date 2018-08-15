const Web3 = require('web3');
var net = require('net');
/**
 * All account is kept by seed phase
 */
// const HDWalletProvider = require('truffle-hdwallet-provider');
// const provider = new HDWalletProvider(
//     'income orchard else soldier spot dog eight business bulb obey swear budget',
//     'https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc'
// );

/**
 * By privateLey array
 */
// const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
// const privKeys = ["4c54f0453dc294005ba7c38944e84074c9e69399d06f8f60109de627fc678fdd"]; // private keys
// const provider = new HDWalletProvider(privKeys, "https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc");

/**
 * By only rcpEndpoint
 */
const rpcEndpoint = 'https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc';
const provider = new Web3.providers.HttpProvider(rpcEndpoint);

const web3 = new Web3(provider);
const asciiToHex = Web3.utils.asciiToHex;

// const compiledCode = require('../compile/compileVoting'); //Load Smart Contract compiled code 

// // Convert contract code to bytecode
// const byteCode = compiledCode.bytecode;

// // Get contract interface - The json interface for the contract to instantiate
// const abiDefinition = JSON.parse(compiledCode.interface);

// const candidates = ['Chung', 'Son', 'Nguyen'];

// Deploy smart contract
const deploy = async () => {
    try {
        let accountPass = '0x4c54f0453dc294005ba7c38944e84074c9e69399d06f8f60109de627fc678fdd';
        // let account = await web3.eth.accounts.wallet.add(accountPass);
        let account = await web3.eth.accounts.privateKeyToAccount(accountPass);
        await web3.eth.personal.unlockAccount(account.address, account.privateKey);
        console.log(account.address);
        if (await isUnlocked(web3, account)) {
            console.log('Balance: ' + await web3.eth.getBalance(account.address));
        } else {
            console.log('is locked');
        }
    } catch (err) {
        console.log(err.message);
    }
}
deploy();

async function isUnlocked(web3, account) {
    try {
        await web3.eth.sign("", account.address, account.privateKey);
    } catch (e) {
        return false;
    }
    return true;
}