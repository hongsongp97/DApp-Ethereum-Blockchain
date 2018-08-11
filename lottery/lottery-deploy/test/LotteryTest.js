const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {

    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface)).deploy({
        data: bytecode
    }).send({
        from: accounts[0],
        gas: '1000000'
    });

});

describe('Lottery Contract Test Suite', () => {

    it('deployed lottery contract successfully', () => {
        assert.ok(lottery.options.address);
    });

    it('allows an user to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(players[0], accounts[0]);
        assert.equal(players.length, 1);
    })

    it('allows many users to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        })

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('1', 'ether')
        })

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('1', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(players[0], accounts[0]);
        assert.equal(players[1], accounts[1]);
        assert.equal(players[2], accounts[2]);
        assert.equal(players.length, 3);
    });

    it('require exactly 1 ether', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utols.toWei(0.2, 'ether')
            });
        } catch (error) {
            assert(error);
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            })
        } catch (error) {
            assert(error);
        }
    });

    it('sends money back to the winner', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        const beforePickWinnerBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const afterPickWinnerBalance = await web3.eth.getBalance(accounts[0]);
        const difference = afterPickWinnerBalance - beforePickWinnerBalance;
        assert(difference < web3.utils.toWei('0.99999', 'ether'));
    })
});