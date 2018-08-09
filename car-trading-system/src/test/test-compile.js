const ContractCompiler = require('../entity/ContractCompiler');

const test = async () => {
    const compilation = new ContractCompiler('Voting', __dirname + '/contracts/Voting.sol');
    await compilation.compileAsync();
    console.log(compilation.message);
}
test();

