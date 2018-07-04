const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc');

const provider = new Web3.providers.HttpProvider("http://localhost:7545")   // Local network by ganache
// const provider = new Web3.providers.HttpProvider("http://deto3j-dns-reg1.southeastasia.cloudapp.azure.com:8545/")

const web3 = new Web3(provider);
const asciiToHex = Web3.utils.asciiToHex;

const candidates = ['Chung', 'Son', 'Nguyen'];

/** 
 * Load Smart Contract code and Compile 
 */

const code = fs.readFileSync('./voting.sol').toString();  //Load code
const compiledCode = solc.compile(code);  //Compile code
// console.log('compiledCode:\n', compiledCode);
/** Done */

/** 
 * Check error and warning 
 */

const errors = [];
const warnings = [];

(compiledCode.errors || []).forEach((err) => {
    if (/\:\s*Warning\:/.test(err)) {   // Get warnings
        warnings.push(err);
    } else {    // Get errors
        errors.push(err);
    }
});

if (errors.length) {
    throw new Error('solc.compile: ' + errors.join('\n'));
}

if (warnings.length) {
    console.warn('solc.compile: ' + warnings.join('\n'));
}
/** Done check */

// Convert contract code to bytecode
const byteCode = compiledCode.contracts[':Voting'].bytecode;
// console.log('byteCode', byteCode);

// Get contract interface
const abiDefinition = JSON.parse(compiledCode.contracts[':Voting'].interface);
// console.log('abiDefinition:\n', abiDefinition);


web3.eth.getAccounts()
    .then((accounts) => {
        // Create Contract by contract interface and data, Contract Address will be generated.
        const VotingContract = new web3.eth.Contract(abiDefinition,
            { data: byteCode, from: accounts[0], gas: 4712388 }
        );

        // console.log('VotingContract:\n', VotingContract);

        /**
         * Deploy Smart Contract (onnly one time for a candidate list )
         */

        VotingContract.deploy({ arguments: [candidates.map(asciiToHex)] })
            .send((err, transactionHash) => {
                if (err) {
                    console.log('Send error' + err);
                } else {
                    console.log('Deployed successfully!\nTransaction Hash: \n', transactionHash);
                }
            })
            .then((result) => {
                let deployedContract = result;
                // console.log('deployedContract:\n', deployedContract);

                // Generate deployedContract.json file to save the S.Contract generated
                fs.writeFile('deployedContract.json', JSON.stringify(deployedContract), 'utf8', (err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Created deployedContract.json successfully!');
                    }
                }));
            })
    });
