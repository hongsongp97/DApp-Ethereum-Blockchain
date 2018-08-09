const util = require('util');
const path = require('path');
const solc = require('solc');

const core = require('../modules/core');

/**
 * A class to perform the compilation of a Solidity smart contract.
 */
class ContractCompiler {
    /**
     * Create a new compilation.
     * @param {string} sourceFile The path to the source file.
     * @param {string} name The name of the contract.
     */
    constructor(name = '', sourceFile) {
        this.sourceFile = sourceFile;
        this.name = name;
    }

    /**
     * Get whether the compilation was successful or not.
     */
    get successful() {
        return this._successful;
    }

    /**
     * Get the compilation result message.
     */
    get message() {
        return this._message;
    }

    /**
     * Get the byte code of the contract if compilation was successful.
     */
    get byteCode() {
        return this._byteCode;
    }

    /**
     * Get the JSON interface of the contract if compilation was successful.
     */
    get jsonInterface() {
        return this._jsonInterface;
    }

    /**
     * Separate warnings and errors from an error list of compilation result.
     * @param {Array<string>} errorList The error list.
     * @return {object} An object that contains the warnings and errors.
     */
    extractWarningsAndErrors(errorList) {
        let warnings = [];
        let errors = [];
        (errorList || []).forEach((err) => {
            if (/\:\s*Warning\:/.test(err)) {
                warnings.push(err);
            } else {
                errors.push(err);
            }
        });
        return { warnings, errors };
    }

    /**
     * Get the list of compilation warnings.
     */
    get warnings() {
        return this._warnings;
    }

    /**
     * Get the list of compilation errors.
     */
    get errors() {
        return this._errors;
    }

    async loadSourceCode() {
        return core.readFileSync(this.sourceFile, 'utf8');
    }

    /**
     * Compile a Solidity smart contract asynchronously.
     * @return {Promise<bool>} A promise that returns the success state of the compilation.
     */
    async compileAsync() {
        let sourceCode = await core.readFileAsync(this.sourceFile, { encoding: 'ASCII' });
        console.info('Compiling %s ...', path.resolve(this.sourceFile));
        this._compiledCode = await solc.compile(sourceCode);

        if (!this.name) {
            let keys = Object.keys(this._compiledCode.contracts).map((key) => key.substr(1));
            this.name = keys.length > 0 ? keys[0] : '';
        }

        let { warnings, errors } = this.extractWarningsAndErrors(this._compiledCode.errors);
        this._warnings = warnings;
        this._errors = errors;

        let contract = this._compiledCode.contracts[':' + this.name];

        if (contract) {
            this._successful = true;
            this._message = 'Compiled code successfully!';
            this._byteCode = contract.bytecode;
            this._jsonInterface = JSON.parse(contract.interface);
            this.generateCompiledFile();
        } else {
            this._successful = false;
            this._message = errors.length === 0
                ? 'Wrong contract name.' : 'Compilation failed with errors.';
        }
        this.logCompilationResult();
        return this._successful;
    }

    async generateCompiledFile() {
        // Generate deployedContract.json file to save the S.Contract generated
        try {
            await core.writeObjectAsync(this._compiledCode, `./build/compile/${this.name}.json`);
            console.log(`Code compilation was saved in: build/compile/${this.name}.json`);
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Log compilation result.
     */
    async logCompilationResult() {
        console.info(`Warnings: ${this._warnings.length}`);
        await this._warnings.forEach((line) => console.warn(line));
        console.info(`Errors: ${this._errors.length}`);
        await this._errors.forEach((line) => console.error(line));
        console.info(this._message);
    }
};

module.exports = ContractCompiler;