const fs = require('fs');
const solc = require('solc');

const sourceCode = fs.readFileSync('./contract/voting.sol', 'utf8');
const compiledCode = solc.compile(sourceCode);  //Compile code
console.log('Compiled code successfully!');

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

// Generate deployedContract.json file to save the S.Contract generated
fs.writeFile('./compile/deployedContract.json', JSON.stringify(compiledCode), 'utf8', (err => {
    if (err) {
        console.log(err);
    } else {
        console.log('Compiled code was saved in deployedContract.json');
    }
}));

module.exports = solc.compile(sourceCode, 1).contracts[':Voting'];