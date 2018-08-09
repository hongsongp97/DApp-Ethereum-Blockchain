const core = require('../modules/core');

const test = () => {
    let fileContent = core.readFileAsync(__dirname + '/test-compile.js')
    .then((content) => {
        console.log(content);
    });
    console.log("ngon");
}
test();