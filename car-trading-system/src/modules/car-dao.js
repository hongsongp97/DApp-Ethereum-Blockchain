const core = require('./core');

/**
 * A class to access information about cars.
 */
class CarDao {
    /**
     * Create a CarDao.
     * @param {string} dataFileName The data file.
     */
    constructor(dataFileName) {
        this.dataFileName = dataFileName;
        this.cars = [];
    }

    /**
     * Load data from file.
     */
    async loadAsync() {
        this.cars = await core.readObjectAsync(this.dataFileName);
    }

    /**
     * Get car by ID.
     * @param {number} carId The car's ID.
     * @return {object} The car object that has the specified ID, or undefined if not found.
     */
    getCarById(carId) {
        return this.cars.find((car) => car.carId === carId);
    }

    /**
     * Save data to file.
     */
    async saveAsync() {
        await core.writeObjectAsync(this.cars, this.dataFileName);
    }

    /**
     * Create a CarDao and load data from file.
     * @param {string} dataFileName The data file.
     */
    static async loadFromFileAsync(dataFileName) {
        let carDao = new CarDao(dataFileName);
        await carDao.loadAsync();
        return carDao;
    }
}

module.exports = CarDao;
