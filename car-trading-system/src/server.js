const path = require('path');
const express = require('express');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const Web3 = require('web3');
const core = require('./modules/core');
const defaultParams = require('./modules/default-params');
const CarTradingController = require('./modules/car-trading-controller');
const CarTradingManager = require('./modules/car-trading-manager');
const CarDao = require('./modules/car-dao');

/**
 * A class that contains the logic of the car trading application.
 */
class CarTradingApplication {
    /**
     * Create a new car trading application.
     * @param {object} configuration The configuration.
     */
    constructor(configuration) {
        this.configuration = configuration;
    }

    /**
     * Get Express configuration.
     */
    get expressConfig() {
        return this.configuration.express;
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
     * Get deployment configuration.
     */
    get deploymentConfig() {
        return this.configuration.ethereum.deployment;
    }

    /**
     * Initialize Web3 instance.
     */
    _initializeWeb3() {
        let provider = new Web3.providers.HttpProvider(this.defaultNetwork.rpcEndpoint);
        this.web3 = new Web3(provider);
        console.log('Web3 initialized.');
    }

    /**
     * Initialize car trading manager.
     */
    async _initializeCarTradingManagerAsync() {
        let receiptFileAbsPath = path.resolve(path.join(
            this.deploymentConfig.outputDirectory.receipt,
            `${this.defaultTarget.contract}-${this.defaultTarget.network}.json`
        ));
        let receipt = await core.readObjectAsync(receiptFileAbsPath);
        this.carTradingManager = new CarTradingManager({
            web3: this.web3,
            contractAddress: receipt.address,
            jsonInterface: receipt.jsonInterface,
            gas: this.defaultNetwork.defaultGas,
            gasPrice: this.defaultNetwork.defaultGasPrice,
        });
        console.log('CarTradingManager initialized.');
        await this.carTradingManager.fetchSellerAddressAsync();
        console.log('Fetched seller\'s address from contract.');
    }

    /**
     * Initialize car DAO.
     */
    async _initializeCarDaoAsync() {
        this.carDao = await CarDao.loadFromFileAsync(path.resolve(path.join(
            this.expressConfig.dataDirectory,
            defaultParams.defaultDataFileName
        )));
        console.log('CarDao initialized.');
    }

    /**
     * Initialize main controller.
     */
    _initializeCarTradingController() {
        this.carTradingController = new CarTradingController(this.carTradingManager, this.carDao);
        console.log('CarTradingController initialized.');
    }

    /**
     * Initialize Express server
     */
    _initializeExpressServer() {
        this.server = express();
        this.server.use(expressSession({
            secret: 'CarTradingSystem',
            resave: false,
            saveUninitialized: false,
        }));
        console.log('Enabled session for Express.');
        this.server.use(express.urlencoded({extended: false}));
        this.server.use(cookieParser());
        console.log('Parsers configured.');
        this.server.set('views', path.resolve(this.expressConfig.viewsDirectory));
        this.server.set('view engine', 'hbs');
        console.log('View & view engine configured.');
        this.server.use(express.static(path.resolve(this.expressConfig.staticAssetsDirectory)));
        this.server.use(express.static(path.resolve(this.expressConfig.dataDirectory)));
        console.log('Static assets configured.');
        this.server.use(this.expressConfig.routerMountPath, this.carTradingController.router);
        console.log(`Mounted CarTradingController routes to ${this.expressConfig.routerMountPath}.`);
        this.server.use((err, req, res, next) => {
            console.error(err);
            res.status(500);
            res.render('error', {
                loginAddress: req.session.loginAddress,
                errorMessage: err.message,
            });
        });
        console.log('Error handler configured.');
    }

    /**
     * Initialize dependencies.
     */
    async initializeDependenciesAsync() {
        this._initializeWeb3();
        await this._initializeCarTradingManagerAsync();
        await this._initializeCarDaoAsync();
        this._initializeCarTradingController();
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
    console.log(`Registered Handlebars partials in ${path.resolve(partialsDirectory)}.`);
    hbs.registerHelper('ternary', require('handlebars-helper-ternary'));
    require('handlebars-helpers')({
        handlebars: hbs.handlebars,
    });
    require('handlebars-layouts').register(hbs.handlebars);
    console.log(`Registered Handlebars helpers.`);
    
}

/**
 * Main function.
 */
async function main() {
    try {
        let configuration = core.loadConfiguration(
            process.argv[2] || path.resolve(defaultParams.defaultConfigurationFile)
        );
        await configureHandlebarsEngineAsync(configuration.express.partialsDirectory);
        await new CarTradingApplication(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();
