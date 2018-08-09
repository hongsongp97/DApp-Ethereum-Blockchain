const ContractCompiler = require('../controller/ContractCompiler');

const test = async () => {
    const compilation = new ContractCompiler('Voting','../contracts/Voting.sol');
    await compilation.compileAsync();
    console.log(compilation.message);
}
test();

