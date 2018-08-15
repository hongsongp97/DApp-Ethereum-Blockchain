const url = require('url');
const express = require('express');
require('express-async-errors');
const Web3 = require('web3');
const ethereumJsUtil = require('ethereumjs-util');
const CarTradingManager = require('./car-trading-manager');
const CarDao = require('./car-dao');

/**
 * A class to contain the routes for the car trading application.
 */
class CarTradingController {
    /**
     * Create the controller.
     * @param {CarTradingManager} carTradingManager The car trading manager.
     * @param {CarDao} carDao The car DAO.
     */
    constructor(carTradingManager, carDao) {
        if (!(carTradingManager instanceof CarTradingManager && carDao instanceof CarDao)) {
            throw new Error('Invalid parameter.');
        }
        this.carTradingManager = carTradingManager;
        this.carDao = carDao;
        this.router = express.Router();
        this._setupRoutes();
    }

    /**
     * Parse carId parameter.
     * @param {string} carIdParam The carId parameter.
     * @return {number} The carId.
     */
    _parseCarIdParameter(carIdParam) {
        if (!carIdParam) {
            throw new Error('Missing parameter \'carId\'.');
        }
        if (!/^(0|[1-9]\d*)$/.test(carIdParam)) {
            throw new Error('Parameter \'carId\' is not an integer.');
        }
        return parseInt(carIdParam);
    }

    /**
     * Parse orderIndex parameter.
     * @param {string} orderIndexParam The orderIndex parameter.
     * @return {number} The orderIndex.
     */
    _parseOrderIndexParameter(orderIndexParam) {
        if (!orderIndexParam) {
            throw new Error('Missing parameter \'orderIndex\'.');
        }
        if (!/^(0|[1-9]\d*)$/.test(orderIndexParam)) {
            throw new Error('Parameter \'orderIndex\' is not an integer.');
        }
        return parseInt(orderIndexParam);
    }

    /**
     * Parse compensationValue parameter.
     * @param {string} compensationValueParam The compensationValue parameter.
     * @return {number} The compensationValue.
     */
    _parseCompensationValueParameter(compensationValueParam) {
        if (!compensationValueParam) {
            throw new Error('Missing parameter \'compensationValue\'.');
        }
        if (!/^(0|[1-9]\d*)$/.test(compensationValueParam)) {
            throw new Error('Parameter \'compensationValue\' is not an integer.');
        }
        return parseInt(compensationValueParam);
    }

    /**
     * Parse address parameter.
     * @param {string} addressParam The address parameter.
     * @return {string} The parsed address with '0x' prepended.
     */
    _parseAddressParameter(addressParam) {
        if (!addressParam) {
            throw new Error('Missing parameter \'address\'.');
        }
        if (!ethereumJsUtil.isValidAddress('0x' + addressParam)) {
            throw new Error('Invalid address provided.');
        }
        return '0x' + addressParam.toLowerCase();
    }

    /**
     * Parse privateKey parameter.
     * @param {string} privateKeyParam The privateKey parameter.
     * @return {string} The parsed privateKey with '0x' prepended.
     */
    _parsePrivateKeyParameter(privateKeyParam) {
        if (!privateKeyParam) {
            throw new Error('Missing or empty parameter \'name\'.');
        }
        if (!ethereumJsUtil.isValidPrivate(ethereumJsUtil.toBuffer('0x' + privateKeyParam))) {
            throw new Error('Invalid private key provided.');
        }
        return '0x' + privateKeyParam.toLowerCase();
    }

    /**
     * Get car by ID and verify if the car is available for purchase.
     * If car with the specified ID does not exist, or the quantity is zero,
     * this will throw an error.
     * @param {number} carId The car's ID.
     * @return {object} The car information.
     */
    _tryGetCarById(carId) {
        let car = this.carDao.getCarById(carId);
        if (!car) {
            throw new Error(`Could not find the car with the specified ID.`);
        }
        if (car.quantity === 0) {
            throw new Error(`Car is not available for purchase.`);
        }
        return car;
    }

    /**
     * Get order by index and verify if the order is pending.
     * If order with the specified index does not exist, or the order is completed,
     * this will throw an error.
     * @param {number} orderIndex The order's index.
     * @return {object} The order information.
     */
    async _tryGetPendingOrderAsync(orderIndex) {
        try {
            let order = await this.carTradingManager.getOrderAsync(orderIndex);
            if (order.status !== 'Pending') {
                throw new Error('Order is already completed.');
            }
            return order;
        } catch (err) {
            throw new Error('Could not retrieve the order with the specified index.');
        }
    }

    /**
     * Parse redirectUrl.
     * @param {string} redirectUrlParam The redirect URL parameter.
     * @param {string} hostname The hostname.
     * @return {boolean} Whether the redirect URL is valid or not.
     */
    _parseRedirectUrl(redirectUrlParam) {
        if (!redirectUrlParam) {
            return '/';
        }
        try {
            let uri = url.parse(redirectUrlParam);
            return uri.path;
        } catch (err) {
            return '/';
        }
    }

    /**
     * Check if the user logged in with an address.
     * @param {Express.Request} req The request.
     * @return {boolean} Whether the user has logged in.
     */
    _isLoggedIn(req) {
        return !!req.session.loginAddress;
    }

    /**
     * Require the user must be logged in with an address.
     * @param {Express.Request} req The request.
     */
    _requireLoggedIn(req) {
        if (!this._isLoggedIn(req)) {
            throw new Error('You must be logged in to perform this action.');
        }
    }

    /**
     * Require the user must be logged in with the seller's address or not.
     * @param {Express.Request} req The request.
     * @param {boolean} isSeller Whether the address must be the seller's address or not.
     */
    _requireLoggedInAs(req, isSeller) {
        this._requireLoggedIn(req);
        if (isSeller && req.session.loginAddress.toLowerCase() !== this.carTradingManager.sellerAddress.toLowerCase()) {
            throw new Error('Only seller can perform this action.');
        }
        if (!isSeller && req.session.loginAddress.toLowerCase() === this.carTradingManager.sellerAddress.toLowerCase()) {
            throw new Error('Seller cannot perform this action.');
        }
    }

    /**
     * Check if the private key matches with an address.
     * @param {string} privateKey The private key.
     * @param {string} address The address.
     * @return {boolean} True if the private key matches with the address, otherwise false.
     */
    _isPrivateKeyMatch(privateKey, address) {
        let derivedAddress = ethereumJsUtil.bufferToHex(
            ethereumJsUtil.privateToAddress(
                ethereumJsUtil.toBuffer(privateKey)
            )
        );
        return derivedAddress.toLowerCase() === address.toLowerCase();
    }

    /**
     * Resolve the car by carId in the order.
     * @param {object} order The order.
     */
    _processOrder(order) {
        order.car = this.carDao.getCarById(order.carId);
        delete order.carId;
    }

    /**
     * Process order collection.
     * @param {Array} orders The order collection.
     */
    _processOrderCollection(orders) {
        orders.reverse();
        for (let order of orders) {
            this._processOrder(order);
        }
    }

    /**
     * GET /
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewIndexPage(req, res) {
        res.render('index', {
            loginAddress: req.session.loginAddress,
            cars: this.carDao.cars,
        });
    }

    /**
     * GET /login
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewLoginPage(req, res) {
        let redirectUrl = this._parseRedirectUrl(req.query.redirectUrl);
        res.render('login', {
            loginAddress: req.session.loginAddress,
            redirectUrl: redirectUrl,
        });
    }

    /**
     * POST /login
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async doLogin(req, res) {
        try {
            let address = this._parseAddressParameter(req.body.address);
            let redirectUrl = this._parseRedirectUrl(req.body.redirectUrl);
            req.session.loginAddress = address;
            res.redirect(redirectUrl);
        } catch (err) {
            res.render('login', {
                loginAddress: req.session.loginAddress,
                address: req.body.address || '',
                redirectUrl: req.body.redirectUrl,
                errorMessage: err.message,
            });
        }
    }

    /**
     * POST /logout
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async doLogout(req, res) {
        let redirectUrl = this._parseRedirectUrl(req.body.redirectUrl);
        req.session.loginAddress = undefined;
        res.redirect(redirectUrl);
    }

    /**
     * GET /buy
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewBuyPage(req, res) {
        if (!this._isLoggedIn(req)) {
            res.redirect(`/login?redirectUrl=${encodeURIComponent(req.originalUrl)}`);
            return;
        }
        this._requireLoggedInAs(req, false);
        let carId = this._parseCarIdParameter(req.query.carId);
        let car = this._tryGetCarById(carId);
        res.render('buy', {
            car: car,
            loginAddress: req.session.loginAddress,
        });
    }

    /**
     * POST /buy
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async doBuy(req, res) {
        this._requireLoggedInAs(req, false);
        let carId = this._parseCarIdParameter(req.body.carId);
        let car = this._tryGetCarById(carId);
        let privateKey = this._parsePrivateKeyParameter(req.body.privateKey);
        if (!this._isPrivateKeyMatch(privateKey, req.session.loginAddress)) {
            res.render('buy', {
                car: car,
                loginAddress: req.session.loginAddress,
                errorMessage: 'Private key does not match with the login address.',
            });
            return;
        }
        let value = Web3.utils.toWei(car.price.toString(), 'ether');
        let result = await this.carTradingManager.createOrderAsync({
            carId: carId,
            value: value,
            buyerAddress: req.session.loginAddress,
            privateKey: privateKey,
        });
        res.render('buy-success', {
            loginAddress: req.session.loginAddress,
            car: car,
            result: result,
        });
    }

    /**
     * GET /orders
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewOrdersPage(req, res) {
        this._requireLoggedIn(req);
        if (req.session.loginAddress.toLowerCase() === this.carTradingManager.sellerAddress.toLowerCase()) {
            let orders = await this.carTradingManager.getAllOrdersAsync();
            this._processOrderCollection(orders);
            res.render('orders', {
                loginAddress: req.session.loginAddress,
                isSeller: true,
                orders: orders,
            });
        } else {
            let orders = await this.carTradingManager.getOrdersByBuyerAsync(req.session.loginAddress);
            this._processOrderCollection(orders);
            res.render('orders', {
                loginAddress: req.session.loginAddress,
                isSeller: false,
                orders: orders,
            });
        }
    }

    /**
     * GET /confirm
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewConfirmOrderPage(req, res) {
        this._requireLoggedInAs(req, true);
        let orderIndex = this._parseOrderIndexParameter(req.query.orderIndex);
        let order = await this._tryGetPendingOrderAsync(orderIndex);
        this._processOrder(order);
        res.render('confirm', {
            loginAddress: req.session.loginAddress,
            order: order,
        });
    }

    /**
     * POST /confirm
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async doConfirmOrder(req, res) {
        this._requireLoggedInAs(req, true);
        let orderIndex = this._parseOrderIndexParameter(req.body.orderIndex);
        let order = await this._tryGetPendingOrderAsync(orderIndex);
        this._processOrder(order);
        let privateKey = this._parsePrivateKeyParameter(req.body.privateKey);
        if (!this._isPrivateKeyMatch(privateKey, order.buyerAddress)) {
            res.render('confirm', {
                order: order,
                loginAddress: req.session.loginAddress,
                errorMessage: 'Private key does not match with the buyer\'s address.',
            });
            return;
        }
        let result = await this.carTradingManager.confirmOrderAsync({
            index: order.index,
            buyerAddress: order.buyerAddress,
            privateKey: privateKey,
        });
        res.render('confirm-success', {
            loginAddress: req.session.loginAddress,
            order: order,
            result: result,
        });
    }

    /**
     * GET /cancel
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async viewCancelOrderPage(req, res) {
        this._requireLoggedInAs(req, true);
        let orderIndex = this._parseOrderIndexParameter(req.query.orderIndex);
        let order = await this._tryGetPendingOrderAsync(orderIndex);
        this._processOrder(order);
        res.render('cancel', {
            loginAddress: req.session.loginAddress,
            order: order,
        });
    }

    /**
     * POST /cancel
     * @param {Express.Request} req The request.
     * @param {Express.Request} res The response.
     */
    async doCancelOrder(req, res) {
        this._requireLoggedInAs(req, true);
        let orderIndex = this._parseOrderIndexParameter(req.body.orderIndex);
        let order = await this._tryGetPendingOrderAsync(orderIndex);
        this._processOrder(order);
        let compensationValue = this._parseCompensationValueParameter(req.body.compensationValue);
        let privateKey = this._parsePrivateKeyParameter(req.body.privateKey);
        if (!this._isPrivateKeyMatch(privateKey, req.session.loginAddress)) {
            res.render('cancel', {
                order: order,
                compensationValue: compensationValue,
                loginAddress: req.session.loginAddress,
                errorMessage: 'Private key does not match with the login address.',
            });
            return;
        }
        let result = await this.carTradingManager.cancelOrderAsync({
            index: order.index,
            value: compensationValue,
            sellerAddress: req.session.loginAddress,
            privateKey: privateKey,
        });
        res.render('cancel-success', {
            loginAddress: req.session.loginAddress,
            order: order,
            result: result,
        });
    }

    /**
     * Setup routes.
     */
    async _setupRoutes() {
        this.router.get('/', this.viewIndexPage.bind(this));
        this.router.get('/login', this.viewLoginPage.bind(this));
        this.router.post('/login', this.doLogin.bind(this));
        this.router.post('/logout', this.doLogout.bind(this));
        this.router.get('/buy', this.viewBuyPage.bind(this));
        this.router.post('/buy', this.doBuy.bind(this));
        this.router.get('/orders', this.viewOrdersPage.bind(this));
        this.router.get('/confirm', this.viewConfirmOrderPage.bind(this));
        this.router.post('/confirm', this.doConfirmOrder.bind(this));
        this.router.get('/cancel', this.viewCancelOrderPage.bind(this));
        this.router.post('/cancel', this.doCancelOrder.bind(this));
    }
}

module.exports = CarTradingController;
