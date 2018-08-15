const contractManagement = require('./contract-management');

const OrderStatus = ['Pending', 'Succeeded', 'Cancelled'];

/**
 * Convert string array to integer array.
 * @param {Array<string>} arr The string array.
 * @return {Array<number>} The integer array.
 */
function stringArrayToIntegerArray(arr) {
    return arr.map((value) => parseInt(value));
}

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
            this.web3 = web3;
            this.contractAddress = contractAddress;
            this.jsonInterface = jsonInterface;
            this.gas = gas;
            this.gasPrice = gasPrice;
    }

    /**
     * Create a transaction.
     * @param {*} params The input parameters.
     * @return {*} The transaction.
     */
    createTransaction({methodName, args = [], value = 0, from, privateKey}) {
        return new contractManagement.MethodExecutionTransaction(this.web3, {
            from: from,
            to: this.contractAddress,
            gas: this.gas,
            gasPrice: this.gasPrice,
            value: value,
            jsonInterface: this.jsonInterface,
            methodName: methodName,
            args: args,
            privateKey: privateKey,
        });
    }

    /**
     * Get the number of orders.
     *
     * @return {Promise<number>} A promise that returns the number of orders.
     */
    async getNumberOfOrdersAsync() {
        let transaction = this.createTransaction({
            methodName: 'getNumberOfOrders',
        });
        let result = await transaction.callAsync();
        return parseInt(result);
    }

    /**
     * Get order information at a specified index.
     *
     * @param {number} index The order's index.
     * @return {Promise<object>} A promise that return the order's information.
     */
    async getOrderAsync(index) {
        let transaction = this.createTransaction({
            methodName: 'orders',
            args: [index],
        });
        let result = await transaction.callAsync();
        return {
            index: index,
            buyerAddress: result.buyerAddress,
            carId: parseInt(result.carId),
            value: result.value,
            status: OrderStatus[parseInt(result.status)],
        };
    }

    /**
     * Get orders by indices.
     * @param {Array} indices The indices.
     */
    async getOrdersByIndicesAsync(indices) {
        let promises = indices.map((index) => this.getOrderAsync(index));
        let orders = await Promise.all(promises);
        return orders;
    }

    /**
     * Get all orders.
     */
    async getAllOrdersAsync() {
        let numberOfOrders = await this.getNumberOfOrdersAsync();
        let indices = [...Array(numberOfOrders).keys()];
        return await this.getOrdersByIndicesAsync(indices);
    }

    /**
     * Get order indices by buyer.
     * @param {string} buyerAddress The buyer's address
     */
    async getOrderIndicesByBuyerAsync(buyerAddress) {
        let transaction = this.createTransaction({
            methodName: 'getOrderIndicesByBuyer',
            args: [buyerAddress],
        });
        let result = await transaction.callAsync();
        return stringArrayToIntegerArray(result);
    }

    /**
     * Get orders by buyer.
     * @param {string} buyerAddress The buyer's address.
     */
    async getOrdersByBuyerAsync(buyerAddress) {
        let indices = await this.getOrderIndicesByBuyerAsync(buyerAddress);
        return await this.getOrdersByIndicesAsync(indices);
    }

    /**
     * Get seller's address.
     *
     * @return {Promise<string>} A promise that returns the seller's address.
     */
    async getSellerAddressAsync() {
        let transaction = this.createTransaction({
            methodName: 'sellerAddress',
        });
        let result = await transaction.callAsync();
        return result;
    }

    /**
     * Fetch seller's address.
     */
    async fetchSellerAddressAsync() {
        this.sellerAddress = await this.getSellerAddressAsync();
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
        let transaction = this.createTransaction({
            methodName: 'createOrder',
            args: [carId],
            value: value,
            from: buyerAddress,
            privateKey: privateKey,
        });
        let receipt = await transaction.sendAsync();
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
        let transaction = this.createTransaction({
            methodName: 'confirmOrder',
            args: [index],
            from: buyerAddress,
            privateKey: privateKey,
        });
        let receipt = await transaction.sendAsync();
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
        let transaction = this.createTransaction({
            methodName: 'cancelOrder',
            args: [index],
            from: sellerAddress,
            privateKey: privateKey,
        });
        let receipt = await transaction.sendAsync();
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
        let transaction = this.createTransaction({
            methodName: 'getContractBalance',
        });
        let result = await transaction.callAsync();
        return result;
    }
}

module.exports = CarTradingManager;
