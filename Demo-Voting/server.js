const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Web3 = require('web3');
const asciiToHex = Web3.utils.asciiToHex;

const server = express();

server.use(bodyParser.urlencoded({ extended: true }))

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
let contractInstance = null;

var deployedContract = null;
var abiDefinition = null;

fs.readFile('deployedContract.json', 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    } else {
        deployedContract = JSON.parse(data);
        // console.log(deployedContract);
        abiDefinition = deployedContract._jsonInterface;
        // console.log(abiDefinition);
        contractInstance = new web3.eth.Contract(abiDefinition, deployedContract.options.address);
    }
});

server.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

server.get('/api/:candidate', (req, res) => {
    var candidateName = req.params.candidate;

    contractInstance.methods.totalVotesFor(asciiToHex(candidateName)).call()
        .then((voteCount) => {
            res.send({
                'candidateName': candidateName,
                'voteCount': voteCount
            }
            );
        });
});

server.post('/api', (req, res) => {
    var candidateName = req.body.candidate;

    web3.eth.getAccounts()
        .then((accounts) => {
            return contractInstance.methods.voteForCandidate(asciiToHex(candidateName)).send({
                    from: accounts[0],
                    gas: 1500000,
                    gasPrice: '500000000000'
                });
        })
        .then(() => {
            return contractInstance.methods.totalVotesFor(asciiToHex(candidateName)).call();
        })
        .then((voteCount) => {
            res.send(
                {
                    'candidateName': candidateName,
                    'voteCount': voteCount
                }
            );
        });
});

server.get('/deployedContract', (req, res) => {
    res.send(deployedContract);
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