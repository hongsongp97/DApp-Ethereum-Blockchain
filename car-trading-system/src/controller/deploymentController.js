const ContractDeployer = require('../entity/ContractDeployer');
const path = require('path');
const params = require('../modules/default-params');
const core = require('../modules/core');

deployContract = async () => {
    try {
        let configuration = core.loadConfiguration(
            process.argv[2] || path.resolve(params.defaultConfigurationFile)
        );

        let defaultTarget = configuration.ethereum.default;
        let defaultNetwork = configuration.ethereum.networks[defaultTarget.network];
        let defaultContract = configuration.ethereum.contracts[defaultTarget.contract];

        await new ContractDeployer({
            rpcEndpoint: defaultNetwork.rpcEndpoint,
            ownerAddress: defaultNetwork.defaultAccount.address,
            ownerPassword: defaultNetwork.defaultAccount.password,
            contractName: defaultContract.name,
            contractSource: defaultContract.sourceFile,
            contractArguments: defaultContract.arguments
        }).deployContract();
    } catch (err) {
        console.error(err);
    }
}

deployContract();