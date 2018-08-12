const contractManagement = require('./contract-management');

const OrderStatus = ['Pending', 'Succeeded', 'Cancelled'];

/**
 * A class that interacts with the CarTrading smart contract.
 */
class CarTradingManager {
    /**
     * Create a car trading manager.
     *
     * @param {*} params The input parameters.
     */
    constructor({web3, contractAddress, jsonInterface,
        gas, gasPrice}) {
        this.transaction = new contractManagement.MethodExecutionTransaction(web3, {
            to: contractAddress,
            gas: gas,
            gasPrice: gasPrice,
            jsonInterface: jsonInterface,
            methodName: '',
            args: [],
        });
    }

    /**
     * Get the number of orders.
     *
     * @return {Promise<number>} A promise that returns the number of orders.
     */
    async getNumberOfOrdersAsync() {
        this.transaction.from = '';
        this.transaction.privateKey = '';
        this.transaction.value = 0;
        this.transaction.methodName = 'getNumberOfOrders';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return parseInt(result);
    }

    /**
     * Get order information at a specified index.
     *
     * @param {number} index The order's index.
     * @return {Promise<object>} A promise that return the order's information.
     */
    async getOrderAsync(index) {
        this.transaction.from = '';
        this.transaction.privateKey = '';
        this.transaction.value = 0;
        this.transaction.methodName = 'orders';
        this.transaction.args = [index];
        let result = await this.transaction.callAsync();
        return {
            index: index,
            buyerAddress: result.buyerAddress,
            carId: parseInt(result.carId),
            value: result.value,
            status: OrderStatus[parseInt(result.status)],
        };
    }

    /**
     * Get seller's address.
     *
     * @return {Promise<string>} A promise that returns the seller's address.
     */
    async getSellerAddressAsync() {
        this.transaction.from = '';
        this.transaction.privateKey = '';
        this.transaction.value = 0;
        this.transaction.methodName = 'sellerAddress';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return result;
    }

    /**
     * Create a new order.
     *
     * NOTE:
     * 1. The transaction must be conducted by the buyer.
     * 2. Calling this function will automatically transfer
     * an amount of ETH equals to the order's value from the
     * buyer's address to the contract's address.
     * @param {*} params The parameters.
     * @param {number} params.carId The car ID.
     * @param {number|string} params.value The order's value.
     * @param {string} params.buyerAddress The buyer's address.
     * @param {string} params.privateKey The buyer's private key.
     *
     * @return {Promise<object>} A promise that return the new order's information.
     */
    async createOrderAsync({carId, value, buyerAddress, privateKey}) {
        this.transaction.from = buyerAddress;
        this.transaction.privateKey = privateKey;
        this.transaction.value = value;
        this.transaction.methodName = 'createOrder';
        this.transaction.args = [carId];
        let receipt = await this.transaction.sendAsync();
        let returnValues = receipt.events['OrderCreated'].returnValues;
        return {
            index: parseInt(returnValues.index),
            buyerAddress: returnValues.buyerAddress,
            carId: parseInt(returnValues.carId),
            value: returnValues.value,
            status: OrderStatus[parseInt(returnValues.status)],
        };
    }

    /**
     * Confirm the order to be successfully completed.
     *
     * NOTE:
     * 1. The transaction must be conducted by the buyer.
     * 2. Calling this function will automatically transfer
     * an amount of ETH equals to the order's value from the
     * contract's address to the seller's address.
     *
     * @param {*} params The parameters.
     * @param {number} params.index The order's index.
     * @param {string} params.buyerAddress The buyer's address.
     * @param {string} params.privateKey The buyer's private key.
     *
     * @return {Promise<object>} A promise that return the updated status of the order.
     */
    async confirmOrderAsync({index, buyerAddress, privateKey}) {
        this.transaction.from = buyerAddress;
        this.transaction.privateKey = privateKey;
        this.transaction.value = 0;
        this.transaction.methodName = 'confirmOrder';
        this.transaction.args = [index];
        let receipt = await this.transaction.sendAsync();
        let returnValues = receipt.events['OrderCompleted'].returnValues;
        return {
            index: parseInt(returnValues.index),
            status: OrderStatus[parseInt(returnValues.status)],
        };
    }

    /**
     * Cancel the order.
     *
     * NOTE:
     * 1. The transaction must be conducted by the seller.
     * 2. Calling this function will automatically transfer
     * an amount of ETH equals to the order's value, plus a
     * compensation value from the seller, from the
     * contract's address to the buyer's address.
     *
     * @param {*} params The parameters.
     * @param {number} params.index The order's index.
     * @param {number|string} params.value The compensation value from the seller.
     * @param {string} params.sellerAddress The seller's address.
     * @param {string} params.privateKey The seller's private key.
     *
     * @return {Promise<object>} A promise that return the updated status of the order.
     */
    async cancelOrderAsync({index, value, sellerAddress, privateKey}) {
        this.transaction.from = sellerAddress;
        this.transaction.privateKey = privateKey;
        this.transaction.value = value;
        this.transaction.methodName = 'cancelOrder';
        this.transaction.args = [index];
        let receipt = await this.transaction.sendAsync();
        let returnValues = receipt.events['OrderCompleted'].returnValues;
        return {
            index: parseInt(returnValues.index),
            status: OrderStatus[parseInt(returnValues.status)],
        };
    }

    /**
     * Get the current contract account's balance.
     *
     * NOTE: The transaction must be conducted by the seller.
     *
     * @param {*} params The parameters.
     * @param {string} params.sellerAddress The seller's address.
     * @param {string} params.privateKey The buyer's password.
     *
     * @return {Promise<string>} A promise that return the contract account's balance.
     */
    async getContractBalanceAsync() {
        this.transaction.from = '';
        this.transaction.privateKey = '';
        this.transaction.value = 0;
        this.transaction.methodName = 'getContractBalance';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return result;
    }
}

module.exports = CarTradingManager;
