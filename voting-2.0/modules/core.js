const util = require('util');
const fs = require('fs');
const readline = require('readline');
const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

/**
 * Load configuration file.
 * @param {string} configurationFile The configuration file path.
 * @return {object} The configuration object.
 */
function loadConfiguration(configurationFile) {
    return JSON.parse(fs.readFileSync(configurationFile, {encoding: 'UTF-8'}));
}

/**
 * Asynchronously write object to file.
 * @param {object} obj The object.
 * @param {string} fileName The path to the output file.
 */
async function writeObjectAsync(obj, fileName) {
    await writeFileAsync(fileName, JSON.stringify(obj, null, 2));
}

/**
 * Asynchronously read object from file.
 * @param {string} fileName The path to the input file.
 * @return {object} The object.
 */
async function readObjectAsync(fileName) {
    return JSON.parse(await readFileAsync(fileName, {encoding: 'UTF-8'}));
}

/**
 * A class to perform I/O operations.
 */
class IO {
    /**
     * Create an I/O object.
     * @param {object} input The input stream.
     * @param {object} output The output stream.
     */
    constructor(input, output) {
        this.io = readline.createInterface({input, output});
    }

    /**
     * Read one line from input stream.
     * @param {string} message The message to be prepended.
     * @return {Promise<string>} A promise that returns the answer.
     */
    readLineAsync(message = '') {
        return new Promise((resolve, reject) => {
            this.io.question(message, (answer) => resolve(answer));
        });
    }

    /**
     * Print a message to output stream.
     * @param {string} message The message to be printed.
     */
    print(message = '') {
        if (typeof(message) !== 'string') {
            message = message.toString();
        }
        this.io.write(message);
    };

    /**
     * Print a message to output stream and append a new line.
     * @param {string} message The message to be printed.
     */
    println(message = '') {
        if (typeof(message) !== 'string') {
            message = message.toString();
        }
        this.io.write(message + '\n');
    };

    /**
     * Close the I/O.
     */
    close() {
        this.io.close();
    }
}

module.exports = {
    loadConfiguration,
    readFileAsync,
    writeFileAsync,
    readObjectAsync,
    writeObjectAsync,
    IO,
};
