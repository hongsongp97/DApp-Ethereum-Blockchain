const express = require('express');
const core = require('./core')
require('express-async-errors');

/**
 * A class to contain the routes for the voting application.
 */
class MainController {
    /**
     * Create the controller.
     */
    constructor() {
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
    }
}

module.exports = MainController;
