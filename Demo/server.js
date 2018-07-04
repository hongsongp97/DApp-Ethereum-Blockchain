const express = require('express');
const fs = require('fs');

const server = express();

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
    }
});

server.get('/', (req, res) => {
    let fileContents = '';
    try {
        fileContents = fs.readFileSync(__dirname + req.url, 'utf8');
    } catch (e) {
        fileContents = fs.readFileSync(__dirname + '/public/index.html', 'utf8');
    }
    res.send(
        fileContents.replace(
            /REPLACE_WITH_CONTRACT_ADDRESS/g,
            deployedContract.options.address
        ).replace(
            /REPLACE_WITH_ABI_DEFINITION/g,
            JSON.stringify(abiDefinition)
        )
    );
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