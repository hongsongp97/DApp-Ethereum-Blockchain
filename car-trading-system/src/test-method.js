const path = require('path');
const Web3 = require('web3');
const defaultParams = require('./modules/default-params');
const core = require('./modules/core');
const contractManagement = require('./modules/contract-management');

/**
 * A class that contains the logic of the method testing program.
 */
class MethodTestingProgram {
    /**
     * Create a new method testing program.
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
     * Initialize Web3.
     */
    initWeb3() {
        let provider = new Web3.providers.HttpProvider(this.defaultNetwork.rpcEndpoint);
        this.web3 = new Web3(provider);
    }

    /**
     * Initialize IO.
     */
    initIO() {
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
        let receiptFileAbsPath = path.resolve(path.join(
            this.deploymentConfig.outputDirectory.receipt,
            `${this.defaultTarget.contract}-${this.defaultTarget.network}.json`
        ));
        let receipt = await core.readObjectAsync(receiptFileAbsPath);
        this.contractAddress = receipt.address;
        this.jsonInterface = receipt.jsonInterface;

        this.io.println(`Contract description loaded from ${receiptFileAbsPath}`);
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
     * Check if method is payable.
     * @param {string} methodName The method name.
     * @return {boolean} A boolean indicating whether the method is payable or not.
     */
    isPayable(methodName) {
        let methodDesc = this.getMethodDescription(methodName);
        if (!methodDesc) {
            throw new Error('Method is not defined in the interface.');
        }
        return methodDesc.payable;
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
        if (result === undefined) {
            return 'undefined';
        }
        if (result === null) {
            return 'null';
        }
        if (typeof(result) === 'object') {
            let keys = Object.keys(result);
            keys.filter((key) => /^\d/.test(key)).forEach((key) => delete result[key]);
            return JSON.stringify(result);
        }
        return result.toString();
    }

    /**
     * Print the transaction receipt.
     * @param {object} receipt The transaction receipt.
     */
    printReceipt(receipt) {
        this.io.println(`Transaction hash: ${receipt.transactionHash}`);
        let events = receipt.events;
        if (events) {
            let eventNames = Object.keys(events);
            this.io.println(`Events: ${eventNames.length}`);
            eventNames.forEach((name) => this.io.println(`\t${name}: ${this.processResult(events[name].returnValues)}`));
        }
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
                let transaction = null;
                switch (this.getMethodExecutionType(methodName)) {
                    case 'call':
                        transaction = new contractManagement.MethodExecutionTransaction(this.web3, {
                            to: this.contractAddress,
                            gas: this.defaultNetwork.defaultGas,
                            gasPrice: this.defaultNetwork.defaultGasPrice,
                            jsonInterface: this.jsonInterface,
                            methodName: methodName,
                            args: args,
                        });
                        let result = await transaction.callAsync();
                        result = this.processResult(result);
                        this.io.println(result);
                        break;
                    case 'send':
                        let value = '0';
                        if (this.isPayable(methodName)) {
                            value = await this.io.readLineAsync('Enter value (leave blank for 0): ');
                            if (!value) {
                                value = '0';
                            } else if (!/^\d+$/.test(value)) {
                                throw new Error('Value must be a non-negative integer.');
                            }
                        }
                        let address = await this.io.readLineAsync('Enter address (leave blank for default account): ');
                        let privateKey = '';
                        if (address) {
                            privateKey = await this.io.readLineAsync('Enter private key: ');
                        } else {
                            address = this.defaultNetwork.defaultAccount.address;
                            privateKey = this.defaultNetwork.defaultAccount.privateKey;
                        }
                        transaction = new contractManagement.MethodExecutionTransaction(this.web3, {
                            from: address,
                            to: this.contractAddress,
                            gas: this.defaultNetwork.defaultGas,
                            gasPrice: this.defaultNetwork.defaultGasPrice,
                            value: value,
                            privateKey: privateKey,
                            jsonInterface: this.jsonInterface,
                            methodName: methodName,
                            args: args,
                        });
                        let receipt = await transaction.sendAsync();
                        this.printReceipt(receipt);
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
            this.initIO();
            this.initWeb3();
            await this.printNetworkInfoAsync();
            await this.loadContractDescriptionAsync();
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
            process.argv[2] || path.resolve(defaultParams.defaultConfigurationFile)
        );
        await new MethodTestingProgram(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
