const ContractCompiler = require('../entity/ContractCompiler');
const core = require('../modules/core');
const path = require('path');
const params = require('../modules/default-params');

const test = async () => {
    let configration = core.loadConfiguration(
        process.argv[2] || path.resolve(params.defaultConfigurationFile)
    );


    let outputDirectory = configration.ethereum.deployment.outputDirectory.compilation;
    console.log(outputDirectory);

    const compilation = new ContractCompiler('Voting', __dirname + '/contracts/Voting.sol');
    await compilation.compileAsync();
    console.log(compilation.message);
}
test();

