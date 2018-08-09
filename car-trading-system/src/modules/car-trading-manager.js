const contractManagement = require('./contract-management');

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
            autoUnlockAccount: true,
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
        this.transaction.password = '';
        this.transaction.methodName = 'getNumberOfOrders';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return result;
    }

    /**
     * Get order information at a specified index.
     * 
     * @param {number} index The order's index.
     * @return {Promise<object>} A promise that return the order's information.
     */
    async getOrderAsync(index) {

    }

    /**
     * Get seller's address.
     * 
     * @return {Promise<string>} A promise that returns the seller's address.
     */
    async getSellerAddressAsync() {

    }

    /**
     * Create a new order.
     * 
     * NOTE:
     * 1. The transaction must be conducted by the buyer.
     * 2. Calling this function will automatically transfer
     * an amount of ETH equals to the order's value from the
     * buyer's address to the contract's address.
     * 
     * @param {*} params The parameters.
     * @param {number} params.carId The car ID.
     * @param {number} params.value The order's value.
     * @param {string} params.buyerAddress The buyer's address.
     * @param {string} params.password The buyer's password.
     * 
     * @return {Promise<object>} A promise that return the new order's information.
     */
    async createOrderAsync({carId, value, buyerAddress, password}) {

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
     * @param {string} params.password The buyer's password.
     * 
     * @return {Promise<object>} A promise that return the updated status of the order.
     */
    async confirmOrderAsync({index, buyerAddress, password}) {

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
     * @param {number} params.value The compensation value from the seller.
     * @param {string} params.sellerAddress The seller's address.
     * @param {string} params.password The buyer's password.
     * 
     * @return {Promise<object>} A promise that return the updated status of the order.
     */
    async cancelOrderAsync({index, value, sellerAddress, password}) {

    }

    /**
     * Get the current contract account's balance.
     * 
     * NOTE: The transaction must be conducted by the seller.
     * 
     * @param {*} params The parameters.
     * @param {string} params.sellerAddress The seller's address.
     * @param {string} params.password The buyer's password.
     * 
     * @return {Promise<number>} A promise that return the contract account's balance.
     */
    async getContractBalanceAsync({sellerAddress, password}) {

    }
}