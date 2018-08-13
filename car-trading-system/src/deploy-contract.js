const path = require('path');
const Web3 = require('web3');
const core = require('./modules/core');
const contractManagement = require('./modules/contract-management');
const defaultParams = require('./modules/default-params');

/**
 * A class that contains the logic of the contract deployment program.
 */
class ContractDeploymentProgram {
    /**
     * Create a new contract deployment program.
     * @param {object} configuration The configuration.
     */
    constructor(configuration) {
        this.configuration = configuration;
    }

    /**
     * Get default target.
     */
    get defaultTarget() {
        return this.configuration.ethereum.default;
    }

    /**
     * Get default network.
     */
    get defaultNetwork() {
        return this.configuration.ethereum.networks[this.defaultTarget.network];
    }

    /**
     * Get default contract.
     */
    get defaultContract() {
        return this.configuration.ethereum.contracts[this.defaultTarget.contract];
    }

    /**
     * Get deployment configuration.
     */
    get deploymentConfig() {
        return this.configuration.ethereum.deployment;
    }

    /**
     * Compile source file.
     */
    async compileSourceFileAsync() {
        let sourceFileAbsPath = path.resolve(this.defaultContract.sourceFile);
        console.info('Compiling %s ...', sourceFileAbsPath);
        this.compilation = await contractManagement.Compilation
                .fromSourceFileAsync(sourceFileAbsPath);
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
     * Initialize Web3.
     */
    initWeb3() {
        let provider = new Web3.providers.HttpProvider(this.defaultNetwork.rpcEndpoint);
        this.web3 = new Web3(provider);
    }

    /**
     * Deploy contract.
     */
    async deployContractAsync() {
        let transaction = new contractManagement.DeploymentTransaction(this.web3, {
            jsonInterface: this.compilation.jsonInterface,
            byteCode: this.compilation.byteCode,
            args: this.defaultContract.arguments,
            from: this.defaultNetwork.defaultAccount.address,
            gas: this.deploymentConfig.defaultGas,
            gasPrice: this.defaultNetwork.defaultGasPrice,
            privateKey: this.defaultNetwork.defaultAccount.privateKey,
        });
        this.receipt = await transaction.sendAsync();
        console.info('Contract was successfully deployed to %s', this.defaultNetwork.rpcEndpoint);
        console.info('Contract address: %s', this.receipt.options.address);
    }

    /**
     * Write contract deployment receipt.
     */
    async writeReceiptAsync() {
        let receipt = {
            address: this.receipt.options.address,
            jsonInterface: this.receipt.options.jsonInterface,
        };
        let receiptFileAbsPath = path.resolve(path.join(
            this.deploymentConfig.outputDirectory.receipt,
            `${this.defaultTarget.contract}-${this.defaultTarget.network}.json`
        ));
        await core.writeObjectAsync(receipt, receiptFileAbsPath);
        console.info('Wrote contract description to %s', receiptFileAbsPath);
    }

    /**
     * Run the program.
     */
    async runAsync() {
        await this.compileSourceFileAsync();
        this.logCompilationResult();
        if (this.compilation.successful) {
            try {
                this.initWeb3();
                await this.deployContractAsync();
                try {
                    await this.writeReceiptAsync();
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
            process.argv[2] || path.resolve(defaultParams.defaultConfigurationFile)
        );
        await new ContractDeploymentProgram(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
