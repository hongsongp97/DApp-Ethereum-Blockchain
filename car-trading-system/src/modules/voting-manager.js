const constants = require('./default-params');
const contractManagement = require('./contract-management');

/**
 * A class to manage votings by the contract.
 */
class VotingManager {
    /**
     * Create a voting manager.
     * @param {*} params The input parameters.
     */
    constructor({web3, contractAddress, jsonInterface,
            ownerAddress, ownerPassword,
            gas = constants.defaultGas, gasPrice = constants.defaultGasPrice}) {
        this.transaction = new contractManagement.MethodExecutionTransaction(web3, {
            from: ownerAddress,
            to: contractAddress,
            gas: gas,
            gasPrice: gasPrice,
            autoUnlockAccount: true,
            password: ownerPassword,
            jsonInterface: jsonInterface,
            methodName: '',
            args: [],
        });
    }

    /**
     * Get the owner of the contract.
     */
    async getOwnerAsync() {
        this.transaction.methodName = 'owner';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return result;
    }

    /**
     * Get the number of candidates.
     */
    async getNumberOfCandidatesAsync() {
        this.transaction.methodName = 'getNumberOfCandidates';
        this.transaction.args = [];
        let result = await this.transaction.callAsync();
        return parseInt(result);
    }

    /**
     * Get the candidate at a specified index.
     * @param {number} index The index of the candidate.
     */
    async getCandidateAsync(index) {
        this.transaction.methodName = 'getCandidate';
        this.transaction.args = [index];
        let result = await this.transaction.callAsync();
        let processedResult = {
            name: result.name,
            votesCount: parseInt(result.votesCount),
        };
        return processedResult;
    }

    /**
     * Get all the candidates.
     */
    async getAllCandidatesAsync() {
        let numberOfCandidates = await this.getNumberOfCandidatesAsync();
        let promises = Array.from({length: numberOfCandidates}, (v, i) => this.getCandidateAsync(i));
        let candidates = await Promise.all(promises);
        return candidates;
    }

    /**
     * Add candidate.
     * @param {string} name The candidate name
     */
    async addCandidateAsync(name) {
        this.transaction.methodName = 'addCandidate';
        this.transaction.args = [name];
        await this.transaction.sendAsync();
    }

    /**
     * Remove candidate at a specified position.
     * @param {number} index The index of the candidate.
     */
    async removeCandidateAsync(index) {
        this.transaction.methodName = 'removeCandidate';
        this.transaction.args = [index];
        await this.transaction.sendAsync();
    }

    /**
     * Remove all candidates.
     */
    async clearAllCandidatesAsync() {
        this.transaction.methodName = 'clearAllCandidates';
        this.transaction.args = [];
        await this.transaction.sendAsync();
    }

    /**
     * Vote for a candidate at a specified index.
     * @param {number} index The index of the candidate.
     */
    async voteAsync(index) {
        this.transaction.methodName = 'vote';
        this.transaction.args = [index];
        await this.transaction.sendAsync();
    }

    /**
     * Reset vote count of a candidate.
     * @param {number} index The index of the candidate.
     */
    async resetVoteCountAsync(index) {
        this.transaction.methodName = 'resetVoteCount';
        this.transaction.args = [index];
        await this.transaction.sendAsync();
    }

    /**
     * Reset vote count of all candidates.
     */
    async resetAllVotesAsync() {
        this.transaction.methodName = 'resetAllVotes';
        this.transaction.args = [];
        await this.transaction.sendAsync();
    }

    /**
     * Close the contract.
     */
    async closeAsync() {
        this.transaction.methodName = 'close';
        this.transaction.args = [];
        await this.transaction.sendAsync();
    }
}

module.exports = VotingManager;
