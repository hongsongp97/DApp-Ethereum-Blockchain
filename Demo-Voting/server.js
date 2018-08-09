const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const asciiToHex = Web3.utils.asciiToHex;

const server = express();

server.use(bodyParser.urlencoded({ extended: true }))

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
// const web3 = new Web3(new Web3.providers.HttpProvider("http://deto3j-dns-reg1.southeastasia.cloudapp.azure.com:8545/"));

const compiledCode = require('./compile/compileVoting');
const abiDefinition = JSON.parse(compiledCode.interface);

server.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

server.get('/api/:candidate', (req, res) => {
    var candidateName = req.params.candidate;

    abiDefinition.methods.totalVotesFor(asciiToHex(candidateName)).call()
        .then((voteCount) => {
            console.log('Getting: ', candidateName + ' - ' + voteCount);
            res.send({
                'candidateName': candidateName,
                'voteCount': voteCount
            }
            );
        })
        .catch((err) => {
            console.log(err);
        })
});

server.post('/api', async (req, res) => {
    var candidateName = req.body.candidate;
    console.log('Voting for ' + candidateName);

    let accounts = await web3.eth.getAccounts();

    // await web3.eth.personal.unlockAccount(accounts[2], 'ngonngon');

    await abiDefinition.methods.voteForCandidate(asciiToHex(candidateName)).send({
        from: accounts[2],
        gas: 1000000,
        gasPrice: web3.utils.toWei('30', 'Gwei')
    });

    let voteCount = await contractInstance.methods.totalVotesFor(asciiToHex(candidateName)).call();

    res.send(
        {
            'candidateName': candidateName,
            'voteCount': voteCount
        }
    );
});

server.get('/abiDefinition', (req, res) => {
    res.send(abiDefinition);
});

server.use(express.static('public'));

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8008, () => {
    console.log('Listening on localhost:8008');
});