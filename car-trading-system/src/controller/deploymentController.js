const ContractDeployer = require('../entity/ContractDeployer');
const core = require('../modules/core');

deployContract = async () => {
    try {
        let configuration = await core.loadConfiguration('./config.json');

        await new ContractDeployer({
            rpcEndpoint: configuration.ropstenEthereum.rpcEndpoint,
            ownerAddress: configuration.ropstenEthereum.defaultAccount.address,
            ownerPassword: configuration.ropstenEthereum.defaultAccount.password,
            contractName: configuration.contracts.CarTrading.name,
            contractSource: configuration.contracts.CarTrading.path,
            contractArguments: configuration.contracts.CarTrading.arguments
        }).deployContract();
    } catch (err) {
        console.error(err);
    }
}

deployContract();