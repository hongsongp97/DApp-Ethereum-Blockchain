const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');

const provider = new HDWalletProvider(
    'income orchard else soldier spot dog eight business bulb obey swear budget',
    'https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc'
);
// const provider = new Web3.providers.HttpProvider("http://localhost:7545")
const web3 = new Web3(provider);
const { interface, bytecode } = require('./compile');

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account ' + accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface)).deploy({
        data: '0x' + bytecode
    }).send({
        from: accounts[0],
        gas: '1000000',
        gasPrice: web3.utils.toWei('20', 'Gwei')
    });

    console.log('Contract deploy at ' + result.options.address);
}
deploy();