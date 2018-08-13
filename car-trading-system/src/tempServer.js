const path = require('path');
const express = require('express');
const hbs = require('hbs');
const core = require('./modules/core');
const MainController = require('./modules/temp-main-controller');

/**
 * A class that contains the logic of the voting application.
 */
class CarTradingApplication {
    /**
     * Create a new voting application.
     * @param {object} configuration The configuration.
     */
    constructor(configuration) {
        this.configuration = configuration;
    }

    /**
     * Initialize main controller.
     */
    _initializeMainController() {
        this.mainController = new MainController(this.votingManager);
    }

    /**
     * Initialize Express server
     */
    _initializeExpressServer() {
        this.server = express();
        this.server.use(express.urlencoded({extended: false}));
        this.server.set('views', path.resolve(this.configuration.express.viewsDirectory));
        this.server.set('view engine', 'hbs');
        this.server.use(express.static(
            path.resolve(this.configuration.express.staticAssetsDirectory)
        ));
        this.server.use(this.configuration.express.routerMountPath, this.mainController.router);
        this.server.use((err, req, res, next) => {
            res.status(500);
            res.render('error', {message: err.message});
        });
    }

    /**
     * Initialize dependencies.
     */
    async initializeDependenciesAsync() {
        this._initializeMainController();
        this._initializeExpressServer();
    }

    /**
     * Start Express server.
     */
    startExpressServer() {
        let localAddress = `http://localhost:${this.configuration.express.port}${this.configuration.express.routerMountPath}`;
        this.server.listen(this.configuration.express.port, () => {
            console.log(`Listening at ${localAddress}`);
        });
    }

    /**
     * Run the application.
     */
    async runAsync() {
        await this.initializeDependenciesAsync();
        this.startExpressServer();
    }
}

/**
 * Configure Handlebars engine.
 * @param {string} partialsDirectory The directory that contains partials.
 */
async function configureHandlebarsEngineAsync(partialsDirectory) {
    await new Promise((resolve, reject) => {
        hbs.registerPartials(path.resolve(partialsDirectory), (err) => {
            if (!err) {
                resolve();
            }
            reject(err);
        });
    });
    hbs.registerHelper('ternary', require('handlebars-helper-ternary'));
    require('handlebars-helpers')({
        handlebars: hbs.handlebars,
    });
    require('handlebars-layouts').register(hbs.handlebars);
}

/**
 * Main function.
 */
async function main() {
    try {
        let configuration = core.loadConfiguration(
            process.argv[2] || path.resolve('./config.json')
        );
        await configureHandlebarsEngineAsync(configuration.express.partialsDirectory);
        await new CarTradingApplication(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();