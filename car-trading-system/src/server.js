const path = require('path');
const express = require('express');
const hbs = require('hbs');
const constants = require('./modules/default-params');
const core = require('./modules/core');
const Web3 = require('web3');
const VotingManager = require('./modules/voting-manager');
const MainController = require('./modules/main-controller');

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
     * Initialize Web3 instance.
     */
    _initializeWeb3() {
        let provider = new Web3.providers.HttpProvider(this.configuration.ropstenEthereum.rpcEndpoint);
        this.web3 = new Web3(provider);
    }

    /**
     * Initialize voting manager.
     */
    async _initializeVotingManagerAsync() {
        let description = await core.readObjectAsync(path.resolve(this.configuration.ethereum.defaultContract.descriptionFile));
        this.votingManager = new VotingManager({
            web3: this.web3,
            contractAddress: description.address,
            jsonInterface: description.jsonInterface,
            ownerAddress: this.configuration.ethereum.defaultAccount.address,
            ownerPrivateKey: this.configuration.ethereum.defaultAccount.privateKey,
        });
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
        // this._initializeWeb3();
        // await this._initializeVotingManagerAsync();
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
            process.argv[2] || path.resolve(constants.defaultConfigurationFile)
        );
        await configureHandlebarsEngineAsync(configuration.express.partialsDirectory);
        await new CarTradingApplication(configuration).runAsync();
    } catch (err) {
        console.error(err);
    }
}

main();