const path = require('path');
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const constants = require('./modules/constants');
const core = require('./modules/core');
const contractManagement = require('./modules/contract-management');

/**
 * A class that contains the logic of the contract deployment program.
 */
class ContractDeploymentProgram {
    /**
     * Create a new contract deployment program.
     * @param {object} params The input parameters.
     */
    constructor({rpcEndpoint, sourceFile, descriptionFile,
                ownerAddress, ownerPassword,
                gas = constants.defaultGas, gasPrice = constants.defaultGasPrice}) {
        let provider = new HDWalletProvider(
            'income orchard else soldier spot dog eight business bulb obey swear budget',
            'https://ropsten.infura.io/v3/836c5137d35d4372997767864435a6cc'
        );
        this.web3 = new Web3(provider);
        this.sourceFile = sourceFile;
        this.descriptionFile = descriptionFile;
        this.ownerAddress = ownerAddress;
        this.ownerPassword = ownerPassword;
        this.gas = gas;
        this.gasPrice = gasPrice;
    }

    /**
     * Compile source file.
     */
    async compileSourceFileAsync() {
        this.compilation = await contractManagement.Compilation
                .fromSourceFileAsync(path.resolve(this.sourceFile));
    }

    /**
     * Log compilation result.
     */
    logCompilationResult() {
        console.info(this.compilation.message);
        console.info(`Warnings: ${this.compilation.warnings.length}`);
        this.compilation.warnings.forEach((line) => console.warn(line));
        console.info(`Errors: ${this.compilation.errors.length}`);
        this.compilation.errors.forEach((line) => console.error(line));
    }

    /**
     * Deploy contract.
     */
    async deployContractAsync() {
        let transaction = new contractManagement.DeploymentTransaction(this.web3, {
            jsonInterface: this.compilation.jsonInterface,
            byteCode: this.compilation.byteCode,
            from: this.ownerAddress,
            gas: this.gas,
            gasPrice: this.gasPrice,
            autoUnlockAccount: true,
            password: this.ownerPassword,
        });
        this.receipt = await transaction.sendAsync();
    }

    /**
     * Write contract description.
     */
    async writeReceipt() {
        let description = {
            address: this.receipt.options.address,
            jsonInterface: this.receipt.options.jsonInterface,
        };
        await core.writeObjectAsync(description, path.resolve(this.descriptionFile));
    }

    /**
     * Run the program.
     */
    async runAsync() {
        console.info('Compiling %s ...', path.resolve(this.sourceFile));
        await this.compileSourceFileAsync();
        this.logCompilationResult();
        if (this.compilation.successful) {
            try {
                await this.deployContractAsync();
                console.info(`Contract was successfully deployed to ${this.web3.currentProvider.host}`);
                console.info(`Contract address: ${this.receipt.options.address}`);
                try {
                    await this.writeReceipt();
                    console.info('Wrote contract description to %s',
                            path.resolve(this.descriptionFile));
                } catch (err) {
                    console.error(`Failed to write transaction receipt: ${err.message}`);
                }
            } catch (err) {
                console.error(`Deployment failed: ${err.message}`);
            }
        }
    }
}

/**
 * Main function.
 */
async function main() {
    try {
        let configuration = core.loadConfiguration(
            process.argv[2] || path.resolve(constants.defaultConfigurationFile)
        );
        await new ContractDeploymentProgram({
            rpcEndpoint: configuration.ethereum.rpcEndpoint,
            sourceFile: configuration.ethereum.defaultContract.sourceFile,
            descriptionFile: configuration.ethereum.defaultContract.descriptionFile,
            ownerAddress: configuration.ethereum.defaultAccount.address,
            ownerPassword: configuration.ethereum.defaultAccount.password,
        }).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
