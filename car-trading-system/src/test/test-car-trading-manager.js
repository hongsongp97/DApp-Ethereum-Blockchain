const assert = require('assert');
const path = require('path');
const Web3 = require('web3');
const core = require('../modules/core');
const contractManagement = require('../modules/contract-management');
const defaultParams = require('../modules/default-params');
const CarTradingManager = require('../modules/car-trading-manager');


/**
 * Perform test.
 * @param {string} testName Test name.
 * @param {*} testFunc Test function.
 * @return {boolean} True if test was successful, otherwise false.
 */
async function performTestAsync(testName, testFunc) {
    try {
        await testFunc();
        console.info(`${testName}: OK`);
        return true;
    } catch (err) {
        console.error(`${testName}: Failed`);
        console.error('\t' + err.message);
        return false;
    }
}

/**
 * A class containing the test logic for CarTradingManager class.
 */
class CarTradingManagerTest {
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
     * Initialize Web3.
     */
    initWeb3() {
        let provider = new Web3.providers.HttpProvider(this.defaultNetwork.rpcEndpoint);
        this.web3 = new Web3(provider);
    }

    /**
     * Print Ethereum network information.
     */
    async printNetworkInfoAsync() {
        console.info(`Connected to Ethereum network at ${this.web3.currentProvider.host}`);
        console.info(`Network ID: ${await this.web3.eth.net.getId()}`);
        console.info(`Protocol version: ${await this.web3.eth.getProtocolVersion()}`);
        console.info(`Current block number: ${await this.web3.eth.getBlockNumber()}`);
    }

    /**
     * Load the contract description file.
     */
    async deployAsync() {
        let sourceFileAbsPath = path.resolve(this.defaultContract.sourceFile);
        console.info('Deploying %s ...', sourceFileAbsPath);
        let compilation = await contractManagement.Compilation.fromSourceFileAsync(sourceFileAbsPath);
        if (!compilation.successful) {
            throw new Error('Contract compilation failed.');
        }
        let transaction = new contractManagement.DeploymentTransaction(this.web3, {
            jsonInterface: compilation.jsonInterface,
            byteCode: compilation.byteCode,
            args: this.defaultContract.arguments,
            from: this.defaultNetwork.defaultAccount.address,
            gas: this.deploymentConfig.defaultGas,
            gasPrice: this.defaultNetwork.defaultGasPrice,
            privateKey: this.defaultNetwork.defaultAccount.privateKey,
        });
        let receipt = await transaction.sendAsync();
        this.contractAddress = receipt.options.address;
        this.jsonInterface = receipt.options.jsonInterface;
        console.info('Successfully deployed to address %s', this.contractAddress);
    }

    /**
     * Test the CarTradingManager class.
     */
    async testAsync() {
        this.carTradingManager = new CarTradingManager({
            web3: this.web3,
            contractAddress: this.contractAddress,
            jsonInterface: this.jsonInterface,
            gas: this.defaultNetwork.defaultGas,
            gasPrice: this.defaultNetwork.defaultGasPrice,
        });
        let total = 5;
        let passed = 0;
        passed += await performTestAsync('Test 1', async () => {
            let numberOfOrders = await this.carTradingManager.getNumberOfOrdersAsync();
            assert.strictEqual(numberOfOrders, 0);
            let sellerAddress = await this.carTradingManager.getSellerAddressAsync();
            assert.strictEqual(sellerAddress, '0xE0B89Cd2aFa083EAF13d291849DD908269524087');
            let contractBalance = await this.carTradingManager.getContractBalanceAsync();
            assert.strictEqual(contractBalance, '0');
            let indices = await this.carTradingManager.getOrderIndicesByBuyerAsync('0xfC25653E400fa3Fc74F051B35b68587A2210606b');
            assert.strictEqual(indices.length, 0);
        });
        passed += await performTestAsync('Test 2', async () => {
            let result = await this.carTradingManager.createOrderAsync({
                carId: 1,
                value: '1000000000000000000',
                buyerAddress: '0xfC25653E400fa3Fc74F051B35b68587A2210606b',
                privateKey: '0x49e22f91859644f4fefae3dd2b09aee95d8ae5588321c2e8f0989f85d6984b9c',
            });
            assert.deepStrictEqual(result, {
                index: 0,
                carId: 1,
                value: '1000000000000000000',
                buyerAddress: '0xfC25653E400fa3Fc74F051B35b68587A2210606b',
                status: 'Pending',
            });
            let numberOfOrders = await this.carTradingManager.getNumberOfOrdersAsync();
            assert.strictEqual(numberOfOrders, 1);
            let newOrder = await this.carTradingManager.getOrderAsync(0);
            assert.deepStrictEqual(newOrder, {
                index: 0,
                carId: 1,
                value: '1000000000000000000',
                buyerAddress: '0xfC25653E400fa3Fc74F051B35b68587A2210606b',
                status: 'Pending',
            });
            let indices = await this.carTradingManager.getOrderIndicesByBuyerAsync('0xfC25653E400fa3Fc74F051B35b68587A2210606b');
            assert.deepStrictEqual(indices, [0]);
            let buyerOrders = await this.carTradingManager.getOrdersByBuyerAsync('0xfC25653E400fa3Fc74F051B35b68587A2210606b');
            assert.strictEqual(buyerOrders.length, 1);
            assert.deepStrictEqual(buyerOrders[0], {
                index: 0,
                carId: 1,
                value: '1000000000000000000',
                buyerAddress: '0xfC25653E400fa3Fc74F051B35b68587A2210606b',
                status: 'Pending',
            });
            let contractBalance = await this.carTradingManager.getContractBalanceAsync();
            assert.strictEqual(contractBalance, '1000000000000000000');
        });
        passed += await performTestAsync('Test 3', async () => {
            let result = await this.carTradingManager.confirmOrderAsync({
                index: 0,
                buyerAddress: '0xfC25653E400fa3Fc74F051B35b68587A2210606b',
                privateKey: '0x49e22f91859644f4fefae3dd2b09aee95d8ae5588321c2e8f0989f85d6984b9c',
            });
            assert.deepStrictEqual(result, {
                index: 0,
                status: 'Succeeded',
            });
            let confirmedOrder = await this.carTradingManager.getOrderAsync(0);
            assert.strictEqual(confirmedOrder.status, 'Succeeded');
            let contractBalance = await this.carTradingManager.getContractBalanceAsync();
            assert.strictEqual(contractBalance, '0');
        });
        passed += await performTestAsync('Test 4', async () => {
            let result = await this.carTradingManager.createOrderAsync({
                carId: 2,
                value: '1200000000000000000',
                buyerAddress: '0xE798f6149bad997Eff3301D2180a53fb268b4413',
                privateKey: '0xc1cc2d80e71086c9ae46f704937533ae656769bff53a13124070705ec39ccb2d',
            });
            assert.deepStrictEqual(result, {
                index: 1,
                carId: 2,
                value: '1200000000000000000',
                buyerAddress: '0xE798f6149bad997Eff3301D2180a53fb268b4413',
                status: 'Pending',
            });
            let numberOfOrders = await this.carTradingManager.getNumberOfOrdersAsync();
            assert.strictEqual(numberOfOrders, 2);
            let newOrder = await this.carTradingManager.getOrderAsync(1);
            assert.deepStrictEqual(newOrder, {
                index: 1,
                carId: 2,
                value: '1200000000000000000',
                buyerAddress: '0xE798f6149bad997Eff3301D2180a53fb268b4413',
                status: 'Pending',
            });
            let indices = await this.carTradingManager.getOrderIndicesByBuyerAsync('0xE798f6149bad997Eff3301D2180a53fb268b4413');
            assert.deepStrictEqual(indices, [1]);
            let buyerOrders = await this.carTradingManager.getOrdersByBuyerAsync('0xE798f6149bad997Eff3301D2180a53fb268b4413');
            assert.strictEqual(buyerOrders.length, 1);
            assert.deepStrictEqual(buyerOrders[0], {
                index: 1,
                carId: 2,
                value: '1200000000000000000',
                buyerAddress: '0xE798f6149bad997Eff3301D2180a53fb268b4413',
                status: 'Pending',
            });
            let contractBalance = await this.carTradingManager.getContractBalanceAsync();
            assert.strictEqual(contractBalance, '1200000000000000000');
        });
        passed += await performTestAsync('Test 5', async () => {
            let result = await this.carTradingManager.cancelOrderAsync({
                index: 1,
                value: '100000',
                sellerAddress: '0xE0B89Cd2aFa083EAF13d291849DD908269524087',
                privateKey: '0xe42cb1ecfce6239ecce8577582639db3ffa6fb51e975d96d5f9aa10a8ebf7cab',
            });
            assert.deepStrictEqual(result, {
                index: 1,
                status: 'Cancelled',
            });
            let cancelledOrder = await this.carTradingManager.getOrderAsync(1);
            assert.strictEqual(cancelledOrder.status, 'Cancelled');
            let contractBalance = await this.carTradingManager.getContractBalanceAsync();
            assert.strictEqual(contractBalance, '0');
        });
        let message = `Total: ${total}, Passed: ${passed}, Failed: ${total - passed}`;

        if (passed === total) {
            console.info(message);
        } else {
            console.error(message);
        }
    }

    /**
     * Run the program.
     */
    async runAsync() {
        this.initWeb3();
        await this.printNetworkInfoAsync();
        await this.deployAsync();
        await this.testAsync();
    }
}
/**
 * The test function.
 */
async function main() {
    try {
        let configuration = core.loadConfiguration(
            process.argv[2] || path.resolve(defaultParams.defaultConfigurationFile)
        );
        await new CarTradingManagerTest(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
