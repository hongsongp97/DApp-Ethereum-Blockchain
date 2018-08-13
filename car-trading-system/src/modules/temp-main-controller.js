const express = require('express');
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
    _setupRoutes() {
        this.router.get('/', async (req, res) => {
            res.render('index', {});
        });
    }
}

module.exports = MainController;
