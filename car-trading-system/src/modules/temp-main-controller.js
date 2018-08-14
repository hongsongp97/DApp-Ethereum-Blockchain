const express = require('express');
require('express-async-errors');
const core = require('./core')
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
        this.router.get('/buy/:carId/:price', async (req, res) => {
            let carId = req.params.carId;
            let price = req.params.price;
            res.render('buy', { name: 'base',  carId});
        });
        this.router.post('/buy/:carId', async (req, res) => {
            let carId = req.params.carId;
            let price = req.params.price;
            let address = req.body.account;
            let privateKey = req.body.privateKey;
            this.carTradingManager.createOrderAsync(carId, price, address, privakey);
            res.redirect('/');
        });
        this.router.get('/search', async (req, res) => {
            res.render('search', { name: 'base' });
        });
        this.router.post('/search', async (req, res) => {
            let address = req.body.address;
            let orders = this.carTradingManager.searchOrderByAddress(address);
            res.render('search', { name: 'base', orders: orders});
        });
    }
}

module.exports = MainController;
