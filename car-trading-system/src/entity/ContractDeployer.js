const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider-privkey');

const ContractCompiler = require('../entity/ContractCompiler');

const core = require('../modules/core');
const params = require('../modules/default-params');

/**
 * A class that contains the logic of the contract deployment program.
 */
class ContractDeployer {
    /**
     * Create a new contract deployment program.
     * @param {object} params The input parameters.
     */
    constructor({ rpcEndpoint, ownerAddress, ownerPassword, contractName, contractSource }) {
        this._rpcEndpoint = rpcEndpoint;
        this._ownerAddress = ownerAddress;
        this._ownerPassword = ownerPassword;
        this.contractName = contractName;
        this.contractSource = contractSource;
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

    setProvider(rpcEndpoint, privateKey) {
        let privateKeys = [];
        privateKeys.push(privateKey);
        this._provider = new HDWalletProvider(privateKeys, rpcEndpoint);
    }

    initWeb3() {
        this.setProvider(this._rpcEndpoint, this._ownerPassword);
        this._web3 = new Web3(this._provider);
    }

    /**
     * Compile source file.
     */
    async compileContract() {
        this._compilation = new ContractCompiler(this.contractName, this.contractSource);
        await this._compilation.compileAsync();
    }

    /**
     * Deploy contract.
     */
    async deployContract() {
        this._successful = false;

        await this.compileContract();

        if (this._compilation.successful) {
            try {
                await this.setProvider(this._rpcEndpoint, this._ownerPassword);
                await this.initWeb3();

                console.info(`Attempting to deploy from account ${this._ownerAddress} ...`);
                this._receipt = await new this._web3.eth.Contract(this._compilation._jsonInterface).deploy({
                    data: '0x' + this._compilation._byteCode,
                }).send({
                    from: this._ownerAddress,
                    gas: params.defaultGas,
                    gasPrice: params.defaultGasPrice
                })

                if (this._receipt) {
                    this._successful = true;
                    this._message = `Contract is deployed successfully at ${this._receipt.options.address}`;
                    this.writeReceipt();
                } else {
                    this._successful = false;
                    this._message = 'Compilation failed with errors.';
                }
                console.log(this._message);
            } catch (err) {
                console.error(`Deployment failed: ${err.message}`);
            }
        }
        return this._successful;
    }

    /**
     * Write contract receipt.
     */
    async writeReceipt() {
        let description = {
            address: this._receipt.options.address,
            jsonInterface: this._receipt.options.jsonInterface,
        };
        try {
            await core.writeObjectAsync(description, `./build/receipt/${this._compilation.name}.json`);
            console.log(`Receipt was saved in: build/receipt/${this._compilation.name}.json`);
        }
        catch (err) {
            console.error(`Failed to write transaction receipt: ${err.message}`);
        }
    }
}

module.exports = ContractDeployer;