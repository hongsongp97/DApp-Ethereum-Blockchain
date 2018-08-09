const ContractDeployer = require('../entity/ContractDeployer');
const core = require('../modules/core');

deployContract = async () => {
    try {
        let configuration = await core.loadConfiguration('./config.json');

        await new ContractDeployer({
            rpcEndpoint: configuration.ropstenEthereum.rpcEndpoint,
            ownerAddress: configuration.ropstenEthereum.defaultAccount.address,
            ownerPassword: configuration.ropstenEthereum.defaultAccount.password,
            contractName: "Voting",
            contractSource: configuration.contracts.Voting
        }).deployContract();
    } catch (err) {
        console.error(err);
    }
}

deployContract();