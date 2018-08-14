const express = require('express');
require('express-async-errors');
const core = require('./core');
const Web3 = require('web3');
const CarTradingManager = require('./car-trading-manager');


/**
 * A class to contain the routes for the voting application.
 */
class MainController {
    /**
     * Create the controller.
     */
    constructor(_carTradingManager) {
        if (!(_carTradingManager instanceof CarTradingManager)) {
            throw new Error('Invalid parameter.');
        }
        this.carTradingManager = _carTradingManager;
        this.router = express.Router();
        this._setupRoutes();
    }

    /**
     * Setup routes.
     */
    async _setupRoutes() {
        let cars = await core.readObjectAsync('./data/data.json');
        this.router.get('/', async (req, res) => {
            res.render('temp-index', { name: 'base', cars });
        });
        this.router.get('/buy/:carID/:price', async (req, res) => {
            let carID = req.params.carID;
            let price = req.params.price;
            res.render('buy', { name: 'base', carID, price });
        });
        this.router.post('/buy/:carID/:price', async (req, res) => {
            let carID = req.params.carID;
            let price = Web3.utils.toWei(req.params.price, 'ether');
            let address = req.body.address;
            let privateKey = req.body.privateKey;

            let order = {
                carId: carID,
                value: price,
                buyerAddress: address,
                privateKey: privateKey
            }
            try {
                let log = await this.carTradingManager.createOrderAsync(order);
                console.log(log);
            }
            catch (err) {
                console.log(err);
            }
            res.redirect('/');
        });
        this.router.get('/search', async (req, res) => {
            res.render('search', { name: 'base' });
        });
        this.router.post('/search', async (req, res) => {
            let address = req.body.address;
            let orders = this.carTradingManager.searchOrderByAddress(address);
            res.render('search', { name: 'base', orders: orders });
        });
    }
}

module.exports = MainController;
