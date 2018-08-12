const util = require('util');
const solc = require('solc');
const readFileAsync = util.promisify(require('fs').readFile);

/**
 * Throw an error to indicate that an operation is unsupported.
 */
function throwUnsupportedError() {
    throw new Error('Unsupported operation.');
}

/**
 * Separate warnings and errors from an error list of compilation result.
 * @param {Array<string>} errorList The error list.
 * @return {object} An object that contains the warnings and errors.
 */
function extractWarningsAndErrors(errorList) {
    let warnings = [];
    let errors = [];
    (errorList || []).forEach((err) => {
        if (/\:\s*Warning\:/.test(err)) {
            warnings.push(err);
        } else {
            errors.push(err);
        }
    });
    return {warnings, errors};
}

/**
 * A class to perform the compilation of a Solidity smart contract.
 */
class Compilation {
    /**
     * Create a new compilation.
     * @param {string} sourceFile The path to the source file.
     * @param {string} name The name of the contract.
     */
    constructor(sourceFile, name = '') {
        this._sourceFile = sourceFile;
        this._name = name;
    }

    /**
     * Get the path to the source file.
     */
    get sourceFile() {
        return this._sourceFile;
    }

    /**
     * Set the path to the source file.
     * @param {string} value The new value.
     */
    set sourceFile(value) {
        this._sourceFile = value;
    }

    /**
     * Get the name of the contract.
     */
    get name() {
        return this._name;
    }

    /**
     * Set the name of the contract.
     * @param {string} value The new value.
     */
    set name(value) {
        this._name = value;
    }

    /**
     * Get whether the compilation was successful or not.
     */
    get successful() {
        return this._successful;
    }

    /**
     * Get the compilation result message.
     */
    get message() {
        return this._message;
    }

    /**
     * Get the list of compilation warnings.
     */
    get warnings() {
        return this._warnings;
    }

    /**
     * Get the list of compilation errors.
     */
    get errors() {
        return this._errors;
    }

    /**
     * Get the byte code of the contract if compilation was successful.
     */
    get byteCode() {
        return this._byteCode;
    }

    /**
     * Get the JSON interface of the contract if compilation was successful.
     */
    get jsonInterface() {
        return this._jsonInterface;
    }

    /**
     * Compile a Solidity smart contract asynchronously.
     * @return {Promise<bool>} A promise that returns the success state of the compilation.
     */
    async compileAsync() {
        let sourceCode = await readFileAsync(this._sourceFile, {encoding: 'ASCII'});
        let solcResult = await solc.compile(sourceCode);
        if (!this._name) {
            let keys = Object.keys(solcResult.contracts)
                    .map((key) => key.substr(1));
            this._name = keys.length > 0 ? keys[0] : '';
        }
        let contract = solcResult.contracts[':' + this._name];
        let {warnings, errors} = extractWarningsAndErrors(solcResult.errors);
        this._warnings = warnings;
        this._errors = errors;
        if (contract) {
            this._successful = true;
            this._message = 'Compilation successful.';
            this._byteCode = contract.bytecode;
            this._jsonInterface = JSON.parse(contract.interface);
        } else {
            this._successful = false;
            this._message = errors.length === 0
                    ? 'Wrong contract name.'
                    : 'Compilation failed with errors.';
        }
        return this._successful;
    }

    /**
     * Compile a Solidity contract file asynchronously.
     * @param {string} sourceFile The path to the source file.
     * @param {string} name The name of the contract.
     * @return {Compilation} A compilation object.
     */
    static async fromSourceFileAsync(sourceFile, name = '') {
        let compilation = new Compilation(sourceFile, name);
        await compilation.compileAsync();
        return compilation;
    }
};

/**
 * A class to represent an Ethereum transaction.
 */
class Transaction {
    /**
     * Create a transaction for sending.
     * @param {object} web3 The Web3 instance to send the transaction.
     * @param {object} params The input parameters.
     * @param {string} params.from The address of the sending account.
     * @param {string} params.to The address of the destinated account.
     * @param {number} params.gas The amount of gas used for the transaction.
     * @param {string} params.gasPrice The gas price used for the transaction.
     * @param {number|string} params.value The value transferred for the transaction.
     * @param {string} params.data The data used in contract deployment or method call.
     * @param {number} params.nonce The nonce of the transaction.
     * @param {string} params.privateKey The private key that
     * will be used to sign the transaction.
     */
    constructor(web3, params) {
        this._web3 = web3;
        this._from = params.from;
        this._to = params.to;
        this._gas = params.gas;
        this._gasPrice = params.gasPrice;
        this._value = params.value;
        this._data = params.data;
        this._nonce = params.nonce;
        this._privateKey = params.privateKey;
    }

    /**
     * Get the Web3 instance to send the transaction.
     */
    get web3() {
        return this._web3;
    }

    /**
     * Set the Web3 instance to send the transaction.
     * @param {object} value The new Web3 instance.
     */
    set web3(value) {
        this._web3 = value;
    }

    /**
     * Get the address of the sending account.
     */
    get from() {
        return this._from;
    }

    /**
     * Set the address of the sending account.
     * @param {string} value The new address.
     */
    set from(value) {
        this._from = value;
    }

    /**
     * Get the address of the destinated account.
     */
    get to() {
        return this._to;
    }

    /**
     * Set the address of the destinated account.
     * @param {string} value The new address.
     */
    set to(value) {
        this._to = value;
    }

    /**
     * Get the amount of gas used for the transaction.
     */
    get gas() {
        return this._gas;
    }

    /**
     * Set the amount of gas used for the transaction.
     * @param {number|string} value The new gas.
     */
    set gas(value) {
        this._gas = value;
    }

    /**
     * Get the gas price used for the transaction.
     */
    get gasPrice() {
        return this._gasPrice;
    }

    /**
     * Set the gas price used for the transaction.
     * @param {number|string} value The new gas price.
     */
    set gasPrice(value) {
        this._gasPrice = value;
    }

    /**
     * Get the value transferred with the transaction.
     */
    get value() {
        return this._value;
    }

    /**
     * Set the value transferred with the transaction.
     * @param {number|string} value The new value.
     */
    set value(value) {
        this._value = value;
    }

    /**
     * Get the data used in contract deployment or method call.
     */
    get data() {
        return this._data;
    }

    /**
     * Set the data used in contract deployment or method call.
     * @param {number} value The new data.
     */
    set data(value) {
        this._data = value;
    }

    /**
     * Get the nonce of the transaction.
     */
    get nonce() {
        return this._nonce;
    }

    /**
     * Set the nonce of the transaction.
     * @param {number} value The new nonce.
     */
    set nonce(value) {
        this._nonce = value;
    }

    /**
     * Get the private key that
     * will be used to sign the transaction.
     */
    get privateKey() {
        return this._privateKey;
    }

    /**
     * Set the private key that
     * will be used to sign the transaction.
     * @param {string} value The new private key.
     */
    set privateKey(value) {
        this._privateKey = value;
    }

    /**
     * Underlying logic for sending transaction.
     * @return {Promise} A promise that returns the transaction receipt.
     */
    async _sendTransactionAsync() {
        return await this._web3.eth.sendTransaction({
            from: this._from,
            to: this._to,
            value: this._value,
            gas: this._gas,
            gasPrice: this._gasPrice,
            data: this._data,
            nonce: this._nonce,
        });
    }

    /**
     * Send the transaction asynchronously.
     * @return {Promise} A promise that returns the transaction receipt.
     */
    async sendAsync() {
        let receipt = null;
        try {
            this._web3.eth.accounts.wallet.add(this._privateKey);
            receipt = await this._sendTransactionAsync();
        } finally {
            this._web3.eth.accounts.wallet.clear();
        }
        return receipt;
    }

    /**
     * Perform a local message call asynchronously.
     * @return {Promise<string>} A promise that returns
     * the result of the call as a string.
     */
    async callAsync() {
        return await this._web3.eth.call({
            from: this._from,
            to: this._to,
            value: this._value,
            gas: this._gas,
            gasPrice: this._gasPrice,
            data: this._data,
            nonce: this._nonce,
        });
    }
}

/**
 * A class to represent an Ethereum smart contract deployment transaction.
 */
class DeploymentTransaction extends Transaction {
    /**
     * Create a deployment transaction.
     * @param {object} web3 The Web3 instance to send the transaction.
     * @param {object} params The input parameters.
     * @param {object} params.jsonInterface The interface of the contract.
     * @param {string} params.byteCode The byte code of the contract.
     * @param {Array} params.args The arguments to initialize the contract.
     */
    constructor(web3, params) {
        super(web3, params);
        this._jsonInterface = params.jsonInterface;
        this._byteCode = params.byteCode;
        this._args = params.args;
    }

    /**
     * Get the interface of the contract.
     */
    get jsonInterface() {
        return this._jsonInterface;
    }

    /**
     * Set the interface of the contract.
     * @param {object} value The new interface.
     */
    set jsonInterface(value) {
        this._jsonInterface = value;
    }

    /**
     * Get the byte code of the contract.
     */
    get byteCode() {
        return this._byteCode;
    }

    /**
     * Set the byte code of the contract.
     * @param {string} value The new byte code.
     */
    set byteCode(value) {
        this._byteCode = value;
    }

    /**
     * Get the arguments to initialize the contract.
     */
    get args() {
        return this._args;
    }

    /**
     * Set the arguments to initialize the contract.
     * @param {Array} value The new arguments.
     */
    set args(value) {
        this._args = value || [];
    }

    /**
     * @inheritDoc
     */
    async _sendTransactionAsync() {
        let contract = new this._web3.eth.Contract(this._jsonInterface);
        let transaction = contract.deploy({
            data: this._byteCode.startsWith('0x')
                    ? this._byteCode
                    : '0x' + this._byteCode,
            arguments: this._args,
        });
        return await transaction.send({
            from: this._from,
            gas: this._gas,
            gasPrice: this._gasPrice,
            value: this._value,
        });
    }

    /**
     * @inheritDoc
     * This function is not implemented and will throw error.
     */
    async callAsync() {
        throwUnsupportedError();
    }
}

/**
 * A class to represent a contract's method execution transaction.
 */
class MethodExecutionTransaction extends Transaction {
    /**
     * Create a method execution transaction.
     * @param {object} web3 The Web3 instance to send the transaction.
     * @param {object} params The input parameters.
     * @param {object} params.jsonInterface The interface of the contract.
     * @param {string} params.methodName The name of the method to be executed.
     * @param {Array} params.args The arguments to be passed to the method.
     */
    constructor(web3, params) {
        super(web3, params);
        this._jsonInterface = params.jsonInterface;
        this._methodName = params.methodName;
        this._args = params.args;
    }

    /**
     * Get the interface of the contract.
     */
    get jsonInterface() {
        return this._jsonInterface;
    }

    /**
     * Set the interface of the contract.
     * @param {object} value The new interface.
     */
    set jsonInterface(value) {
        this._jsonInterface = value;
    }

    /**
     * Get the name of the method to be executed.
     */
    get methodName() {
        return this._methodName;
    }

    /**
     * Set the name of the method to be executed.
     * @param {string} value The new method name.
     */
    set methodName(value) {
        this._methodName = value;
    }

    /**
     * Get the arguments to be passed to the method.
     */
    get args() {
        return this._args;
    }

    /**
     * Set the arguments to be passed to the method.
     * @param {Array} value The new arguments.
     */
    set args(value) {
        this._args = value || [];
    }

    /**
     * @inheritDoc
     */
    async _sendTransactionAsync() {
        let contract = new this._web3.eth.Contract(this._jsonInterface, this._to);
        let transaction = contract.methods[this._methodName](...this._args);
        return await transaction.send({
            from: this._from,
            gas: this._gas,
            gasPrice: this._gasPrice,
            value: this._value,
        });
    }

    /**
     * @inheritDoc
     */
    async callAsync() {
        let contract = new this._web3.eth.Contract(this._jsonInterface, this._to);
        let transaction = contract.methods[this._methodName](...this._args);
        return await transaction.call({
            from: this._from,
            gas: this._gas,
            gasPrice: this._gasPrice,
        });
    }
}

module.exports = {
    Compilation,
    Transaction,
    DeploymentTransaction,
    MethodExecutionTransaction,
};
