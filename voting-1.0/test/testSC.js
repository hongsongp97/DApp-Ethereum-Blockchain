const fs = require('fs');
const Web3 = require('web3');
const asciiToHex = Web3.utils.asciiToHex;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
let contractInstance = null;

var deployedContract = null;

// web3.eth.getTransaction('0x0f7edcd688c0baab166901fdb3aedeccb0e976c4d35c6ad259667fe0591db1d0')
// .then((result) => {
//     console.log(result);
// })

web3.eth.getBalance('0xfa3fb240771aff9E38279Ce4179F31Acc772592E')
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    })

web3.eth.sendTransaction({
    from: '0x43A69897dC9C038B31209f46f1E6d8Cb8105B8E7',
    to: '0xfa3fb240771aff9E38279Ce4179F31Acc772592E',
    value: 30000000000000000000
})
    .then((result) => {
        web3.eth.getBalance('0xfa3fb240771aff9E38279Ce4179F31Acc772592E')
            .then((result) => {
                console.log(result);
            })
            .catch((err) => {
                console.log(err);
            })
    })
    .catch((err) => {
        console.log(err);
    })



const getSC = () => new Promise((resolve, reject) => {
    fs.readFile('deployedContract.json', 'utf8', (err, data) => {
        if (err) {
            reject(err);
        } else {
            deployedContract = JSON.parse(data);
            // console.log(deployedContract);
            contractInstance = new web3.eth.Contract(deployedContract._jsonInterface, deployedContract.options.address);
            resolve();
        }
    });
});

getSC()
    .then(() => {
        contractInstance.methods.getCandidateCount().call()
            .then((value) => {
                console.log('Current candidate number: ' + value);
            });
    });

web3.eth.getAccounts()
    .then((accounts) => {
        getSC()
            .then(() => {
                // contractInstance.methods.addCandidate(asciiToHex('Hoang')).send({
                //     from: accounts[0],
                //     gas: 1500000,
                //     gasPrice: '500000000000'
                // })
                //     .then(() => {
                //         contractInstance.methods.getCandidateCount().call()
                //             .then((value) => {
                //                 console.log('Current candidate number: ' + value);
                //             });
                //     })

            })
            .catch(err => {
                console.log(err);
            })
    });
