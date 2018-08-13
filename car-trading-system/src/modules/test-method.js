const path = require('path');
const Web3 = require('web3');
const constants = require('./modules/constants');
const core = require('./modules/core');
const contractManagement = require('./modules/contract-management');

/**
 * A class that contains the logic of the method testing program.
 */
class MethodTestingProgram {
    /**
     * Create a new method testing program.
     * @param {object} params The input parameters.
     */
    constructor({rpcEndpoint, descriptionFile, ownerAddress, ownerPassword,
                gas = constants.defaultGas, gasPrice = constants.defaultGasPrice}) {
        let provider = new Web3.providers.HttpProvider(rpcEndpoint);
        this.web3 = new Web3(provider);
        this.descriptionFile = descriptionFile;
        this.ownerAddress = ownerAddress;
        this.ownerPassword = ownerPassword;
        this.gas = gas;
        this.gasPrice = gasPrice;

        this.io = new core.IO(process.stdin, process.stdout);
    }

    /**
     * Print Ethereum network information.
     */
    async printNetworkInfoAsync() {
        this.io.println(`Connected to Ethereum network at ${this.web3.currentProvider.host}`);
        this.io.println(`Network ID: ${await this.web3.eth.net.getId()}`);
        this.io.println(`Protocol version: ${await this.web3.eth.getProtocolVersion()}`);
        this.io.println(`Current block number: ${await this.web3.eth.getBlockNumber()}`);
    }

    /**
     * Load the contract description file.
     */
    async loadContractDescriptionAsync() {
        let description = await core.readObjectAsync(path.resolve(this.descriptionFile));
        this.contractAddress = description.address;
        this.jsonInterface = description.jsonInterface;
    }

    /**
     * Print contract description.
     */
    printContractDescription() {
        this.io.println(`Contract description loaded from ${path.resolve(this.descriptionFile)}`);
        this.io.println(`Contract address: ${this.contractAddress}`);
    }

    /**
     * Get method description from interface.
     * @param {string} methodName The method name.
     * @return {object} The method description.
     */
    getMethodDescription(methodName) {
        return this.jsonInterface.find((desc) =>
            desc.type === 'function' && desc.name === methodName);
    }

    /**
     * Get method execution type.
     * @param {string} methodName The method name.
     * @return {string} The execution type, which is 'call' or 'send'.
     */
    getMethodExecutionType(methodName) {
        let methodDesc = this.getMethodDescription(methodName);
        return !methodDesc
            ? undefined
            : methodDesc.constant
                ? 'call'
                : 'send';
    }

    /**
     * Verify method name and arguments against its description.
     * @param {string} methodName The method name.
     * @param {Array} args The arguments.
     */
    verifyMethodExecutionParams(methodName, args) {
        let methodDesc = this.getMethodDescription(methodName);
        if (!methodDesc) {
            throw new Error('Method is not defined in the interface.');
        }
        if (methodDesc.inputs.length !== args.length) {
            throw new Error('Method argument count mismatch.');
        }
    }

    /**
     * Parse command.
     * @param {string} command The command.
     * @return {object} An object that includes the method name and arguments.
     */
    parseCommand(command) {
        if (!command) {
            throw new Error('Command is empty.');
        }
        let regex = /^([a-zA-Z_$][0-9a-zA-Z_$]*)\((.*)\);?$/;
        let result = regex.exec(command.trimRight());
        if (result.length !== 3) {
            throw new Error('Invalid command structure.');
        }
        let methodName = result[1];
        let args = [];
        try {
            args = JSON.parse('[' + result[2] + ']');
        } catch (err) {
            throw new Error('Invalid arguments.');
        }
        return {methodName, args};
    }

    /**
     * Process the result.
     * @param {object} result The result.
     * @return {string} The processed result as string.
     */
    processResult(result) {
        if (typeof(result) === 'object') {
            let keys = Object.keys(result);
            keys.filter((key) => /^\d/.test(key)).forEach((key) => delete result[key]);
            return JSON.stringify(result);
        }
        return result.toString();
    }

    /**
     * Run REPL.
     */
    async runReplAsync() {
        while (true) {
            try {
                let command = await this.io.readLineAsync('Enter command: ');
                if (command === 'exit' || command === 'quit') {
                    return;
                }
                let {methodName, args} = this.parseCommand(command);
                this.verifyMethodExecutionParams(methodName, args);
                let transaction = new contractManagement.MethodExecutionTransaction(this.web3, {
                    from: this.ownerAddress,
                    to: this.contractAddress,
                    gas: this.gas,
                    gasPrice: this.gasPrice,
                    autoUnlockAccount: true,
                    password: this.ownerPassword,
                    jsonInterface: this.jsonInterface,
                    methodName: methodName,
                    args: args,
                });
                switch (this.getMethodExecutionType(methodName)) {
                    case 'call':
                        let result = await transaction.callAsync();
                        result = this.processResult(result);
                        this.io.println(result);
                        break;
                    case 'send':
                        let receipt = await transaction.sendAsync();
                        this.io.println(`Transaction hash: ${receipt.transactionHash}`);
                        break;
                    default:
                        throw new Error('Could not determine execution type.');
                }
            } catch (err) {
                this.io.println(err.message);
            }
        }
    }

    /**
     * Run the program.
     */
    async runAsync() {
        try {
            await this.printNetworkInfoAsync();
            await this.loadContractDescriptionAsync();
            this.printContractDescription();
            this.io.println();
            await this.runReplAsync();
            this.io.println('Exitting program...');
        } finally {
            this.io.close();
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
        await new MethodTestingProgram({
            rpcEndpoint: configuration.ethereum.rpcEndpoint,
            descriptionFile: configuration.ethereum.defaultContract.descriptionFile,
            ownerAddress: configuration.ethereum.defaultAccount.address,
            ownerPassword: configuration.ethereum.defaultAccount.password,
        }).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
