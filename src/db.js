import { databaseCredentials } from './config';
import mysql from 'mysql'

const dbHelper = {
    db: mysql.createPool(databaseCredentials)
}

dbHelper.addEntryToDatabase = (entry) => {
    dbHelper.db.query('INSERT INTO Events SET ?', formatEvent(entry), function(err, results, fields) {
        if (!err) {
            console.log("New event saved in DB")
        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                console.log("skipped 1 duplicate entry")
            } else {
                console.log("error saving new event: ", err)
            }
        }
    });

    function formatEvent(log) {
        return {
            token: "CK",
            blockHash: log.transaction.blockHash,
            txHash: log.transaction.hash,
            event: log.decodedInputDataResult.name.charAt(0).toUpperCase() + log.decodedInputDataResult.name.substr(1, log.decodedInputDataResult.name.length),
            metadata: JSON.stringify(log),
            logId: log.transaction.hash + '-' + log.transaction.nonce,
            blockHeight: log.transaction.blockNumber,
            timestamp: log.transaction.blockTime * 1000
        }
    }
};


export default dbHelper;