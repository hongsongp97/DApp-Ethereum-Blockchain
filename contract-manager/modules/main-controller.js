const express = require('express');
require('express-async-errors');
const VotingManager = require('./voting-manager');

/**
 * A class to contain the routes for the voting application.
 */
class MainController {
    /**
     * Create the controller.
     * @param {VotingManager} votingManager The voting manager.
     */
    constructor(votingManager) {
        if (!(votingManager instanceof VotingManager)) {
            throw new Error('Invalid parameter.');
        }
        this.votingManager = votingManager;
        this.router = express.Router();
        this._setupRoutes();
    }

    /**
     * Parse index parameter.
     * @param {string} indexParam The index parameter.
     * @return {number} The parsed index.
     */
    _parseIndexParameter(indexParam) {
        if (!indexParam) {
            throw new Error('Missing parameter \'index\'.');
        }
        if (!/^(0|[1-9]\d*)$/.test(indexParam)) {
            throw new Error('Parameter \'index\' is not an integer.');
        }
        return parseInt(indexParam);
    }

    /**
     * Parse name parameter.
     * @param {string} nameParam The name parameter.
     * @return {name} The parsed name.
     */
    _parseNameParameter(nameParam) {
        if (!nameParam) {
            throw new Error('Missing or empty parameter \'name\'.');
        }
        return nameParam;
    }

    /**
     * Setup routes.
     */
    _setupRoutes() {
        this.router.get('/', async (req, res) => {
            let candidates = await this.votingManager.getAllCandidatesAsync();
            res.render('index', {candidates});
        });
        this.router.post('/vote', async (req, res) => {
            let index = this._parseIndexParameter(req.body.index);
            await this.votingManager.voteAsync(index);
            res.redirect('/');
        });
        this.router.post('/resetVoteCount', async (req, res) => {
            let index = this._parseIndexParameter(req.body.index);
            await this.votingManager.resetVoteCountAsync(index);
            res.redirect('/');
        });
        this.router.post('/resetAllVotes', async (req, res) => {
            await this.votingManager.resetAllVotesAsync();
            res.redirect('/');
        });
        this.router.post('/addCandidate', async (req, res) => {
            let name = this._parseNameParameter(req.body.name);
            await this.votingManager.addCandidateAsync(name);
            res.redirect('/');
        });
        this.router.post('/removeCandidate', async (req, res) => {
            let index = this._parseIndexParameter(req.body.index);
            await this.votingManager.removeCandidateAsync(index);
            res.redirect('/');
        });
        this.router.post('/clearAllCandidates', async (req, res) => {
            await this.votingManager.clearAllCandidatesAsync();
            res.redirect('/');
        });
    }
}

module.exports = MainController;
