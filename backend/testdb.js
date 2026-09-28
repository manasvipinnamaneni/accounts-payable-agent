require("dotenv").config();

const {
    testDatabaseConnection
} = require("./config/db");


async function test() {

    try {

        await testDatabaseConnection();

        console.log("Database test successful.");

        process.exit(0);

    } catch (error) {

        console.error("Database test failed.");

        process.exit(1);

    }

}


test();