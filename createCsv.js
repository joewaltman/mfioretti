let moment = require('moment')
let Json2csvParser = require('json2csv').Parser
let mysql = require('mysql')

const dbCreds = {
    connectionLimit: 10,
    host: "erc20tokendatabase.cs0t3mxmvoto.us-east-2.rds.amazonaws.com",
    database: "erc20TokenDatabase",
    user: "erc20TokenUser",
    password: "PJJ6vC8AS4F2sDsbSSXKCTdHHCUYDYWd",
    port: "3306"
}

let db = mysql.createPool(dbCreds)
let json = {}
let dates = []

let today = new Date()
let priorDate = new Date().setDate(today.getDate() - 40)

const CONTRACTS = {
    '0xb1690c08e213a35ed9bab7b318de14420fb57d8c': 'Sales Auction',
    '0xc7af99fe5513eb6710e6d5f44f9989da40f27f26': 'Siring Auction',
    '0x06012c8cf97bead5deae237070f9587f8e7a266d': 'Crypto Kitties Core',
    "0x048717ea892f23fb0126f00640e2b18072efd9d2": 'Etheroll',
    "0xddf0d0b9914d530e0b743808249d9af901f1bd01": 'Etheroll',
    "0x3ad2bfea535bf1673f22de61b19f758a2dd0efff": 'Etheroll',
    "0x57b116da40f21f91aec57329ecb763d29c1b2355": 'IdleEth',
    "0xdda9bcd985b1169607546b52910a0269dff5baf1": 'Goo',
    "0xe0c85b973afcfbec4033d8524e2366d7faaa3487": 'GooLaunchPromotion',
    "0xcaef67f72114b4d2b4f43e7407455285b7de8de5": 'EtheremonGym',
    "0x1fc7bd85293f3982f40d52698df8d26be89360d6": 'EtheremonWorld',
}

//db.query('SELECT `metadata`,`event`,`timestamp` FROM Events LIMIT 10000', function(err, results, fields) {
db.query('SELECT `metadata`,`timestamp` FROM Events WHERE `token` = "CK" AND `timestamp` >= ?', priorDate, function(err, results, fields) {
    if (!err) {
        results.forEach(result => {
            let date = new Date(parseInt(result.timestamp)).toLocaleString().split(', ')[0]
            if (dates.indexOf(date) === -1) dates.push(date)

            // Events
            JSON.parse(result.metadata).decodedLogs.forEach(log => {
                if (!json[CONTRACTS[log.address]]) json[CONTRACTS[log.address]] = {}
                if (!json[CONTRACTS[log.address]][log.name]) json[CONTRACTS[log.address]][log.name] = {}
                if (!json[CONTRACTS[log.address]][log.name][date]) json[CONTRACTS[log.address]][log.name][date] = {
                    count: 0
                }

                json[CONTRACTS[log.address]][log.name][date].count++
            })

            // Internal
            let internalLog = JSON.parse(result.metadata).decodedInputDataResult
            if (!json['internalFunctionCalls']) json['internalFunctionCalls'] = {}
            if (!json['internalFunctionCalls'][internalLog.name]) json['internalFunctionCalls'][internalLog.name] = {}
            if (!json['internalFunctionCalls'][internalLog.name][date]) json['internalFunctionCalls'][internalLog.name][date] = {
                count: 0
            }

            json['internalFunctionCalls'][internalLog.name][date].count++
        })

        // Set data
        const fields = getTopColumn(json)
        let allDates = fields.split('Event,')[1].split(',')

        //get list of all dates
        let listOfAllDatesInBetween = getDates(new Date(allDates[0]), new Date(allDates[allDates.length - 1]))
        let csvData = generateCsv(json)

        console.log(fields)
        csvData.forEach(str => {
            console.log(str)
        })

        function generateCsv(json) {

            let csvData = []
            Object.keys(json).forEach((contract, index) => {

                let newRow = ""
                if (index) newRow += "\n"

                Object.keys(json[contract]).forEach((event, eventIndex) => {
                    if (!eventIndex) {
                        newRow += contract + ","
                    } else {
                        newRow = ","
                    }

                    // Add the event
                    newRow += event + ','

                    // Add the counts
                    let counts = []

                    listOfAllDatesInBetween.forEach(initialDate => {
                        let dateFound = null

                        Object.keys(json[contract][event]).forEach(date => {
                            if (date === initialDate) {
                                dateFound = date
                            }
                        })

                        if (dateFound) {
                            counts.push(json[contract][event][dateFound].count)
                        } else {
                            counts.push(0)
                        }

                    })

                    newRow += counts.join(',')
                    csvData.push(newRow)
                })
            })
            return csvData
        }


        return process.exit()


        /*

        Object.keys(json).forEach(contractName => {
            if (contractName != 'internalFunctionCalls') {
                console.log("\n\n")
                console.log("******************************************************")
                console.log("*********** Data for " + contractName + " ************")
                Object.keys(json[contractName]).forEach(event => {
                    Object.keys(json[contractName][event]).forEach(date => {
                        console.log(event + " happened " + json[contractName][event][date].count + " on " + date)
                    })
                })
                console.log("****************************************************")
            }
        })

        // Internal

        console.log("\n\n")
        console.log("*****************************************************")
        console.log("*********** Data - Internal Transactions ************")
        Object.keys(json['internalFunctionCalls']).forEach(key => {
            Object.keys(json['internalFunctionCalls'][key]).forEach(date => {
                console.log(key + " happened " + json['internalFunctionCalls'][key][date].count + " times on " + date)
            })
            console.log("*************************************************")
        })

        return process.exit()

        */

        // const fields = [...dates]
        // const values = []

        // Object.keys(json).map(contractName => {
        //     Object.keys(json[contractName]).map(eventName => {
        //         values.push({
        //             Day: 'asd',
        //             Event: eventName,
        //             Count: json[contractName][eventName].count
        //         })
        //     })
        // })

        // const json2csvParser = new Json2csvParser({ fields });
        // const csv = json2csvParser.parse(json);
        // console.log(csv)
        // process.exit()

    } else {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log("skipped 1 duplicate entry")
        } else {
            console.log("error fetching: ", err)
        }
    }
});

/**
 * Get the top column of the csv file
 * @param  {Object} Our object of data
 * @return {string} The first row of the csv
 */
function getTopColumn(json) {
    let dates = []
    let topRow = "Contract,Event,"

    Object.keys(json).forEach(contract => {
        Object.keys(json[contract]).forEach(event => {
            if (dates.length < Object.keys(json[contract][event]).length) {
                dates = Object.keys(json[contract][event])
            }
        })
    })

    return topRow + dates.join(',')
}

function getDates(startDate, stopDate) {
    var dateArray = [];
    var currentDate = moment(startDate);
    var stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push(moment(currentDate).format('M/D/YYYY'))
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}


// {
//     "Crypto Kitties Core": {
//         "Transfer": {
//             "4/2/2018": { "count": 784 }
//         },
//         "Pregnant": { "4/2/2018": { "count": 258 } },
//         "Birth": { "4/2/2018": { "count": 14 } }
//     },
//     "internalFunctionCalls": {
//         "transfer": { "4/2/2018": { "count": 109 } },
//         "cancelAuction": { "4/2/2018": { "count": 130 } },
//         "createSaleAuction": { "4/2/2018": { "count": 235 } },
//         "bid": { "4/2/2018": { "count": 132 } },
//         "bidOnSiringAuction": { "4/2/2018": { "count": 59 } },
//         "breedWithAuto": { "4/2/2018": { "count": 210 } },
//         "createSiringAuction": { "4/2/2018": { "count": 109 } },
//         "createGen0Auction": { "4/2/2018": { "count": 14 } },
//         "giveBirth": { "4/2/2018": { "count": 1 } },
//         "approveSiring": { "4/2/2018": { "count": 1 } }
//     },
//     "Sales Auction": { "AuctionCancelled": { "4/2/2018": { "count": 86 } }, "AuctionCreated": { "4/2/2018": { "count": 244 } }, "AuctionSuccessful": { "4/2/2018": { "count": 125 } } },
//     "Siring Auction": { "AuctionSuccessful": { "4/2/2018": { "count": 57 } }, "AuctionCreated": { "4/2/2018": { "count": 106 } }, "AuctionCancelled": { "4/2/2018": { "count": 43 } } }
// }