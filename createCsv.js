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
let priorDate = new Date().setDate(today.getDate() - 30)

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

let limit = 2500
let offset = 0
let results = []

getData(limit, offset, results, [])

async function getData(limit, offset, results, newRows) {
    //base case
    if (!newRows) {
        let data = await fetch(limit, offset)
        getData(limit, offset, results, data)
    }

    results = results.concat(newRows)
    if (newRows.length > 0 && newRows.length < limit) {
        formatData(results)
    } else {
        offset += newRows.length
        let data = await fetch(limit, offset)
        getData(limit, offset, results, data)
    }
}

function fetch(limit, offset) {
    return new Promise((resolve, reject) => {
        db.query('SELECT `metadata`,`timestamp` FROM Events WHERE `token` = "CK" AND `timestamp` >= ? LIMIT ' + limit + ' OFFSET ' + offset, priorDate, function(err, results, fields) {
            if (err) {
                console.log("got an error fetching...")
                console.log(err)
            } else {
                return resolve(results)
            }
        })
    })
}


function formatData(results) {
    for (var i = 0; i < results.length; i++) {
        let date = new Date(parseInt(results[i].timestamp)).toLocaleString().split(' ')[0]
        date = moment(date).format('M/D/YYYY')
        if (dates.indexOf(date) === -1) dates.push(date)

        // Events
        JSON.parse(results[i].metadata).decodedLogs.forEach(log => {
            if (!json[CONTRACTS[log.address]]) json[CONTRACTS[log.address]] = {}
            if (!json[CONTRACTS[log.address]][log.name]) json[CONTRACTS[log.address]][log.name] = {}
            if (!json[CONTRACTS[log.address]][log.name][date]) json[CONTRACTS[log.address]][log.name][date] = {
                count: 0
            }

            json[CONTRACTS[log.address]][log.name][date].count++
        })

        // Internal
        let internalLog = JSON.parse(results[i].metadata).decodedInputDataResult
        if (!json['internalFunctionCalls']) json['internalFunctionCalls'] = {}
        if (!json['internalFunctionCalls'][internalLog.name]) json['internalFunctionCalls'][internalLog.name] = {}
        if (!json['internalFunctionCalls'][internalLog.name][date]) json['internalFunctionCalls'][internalLog.name][date] = {
            count: 0
        }

        json['internalFunctionCalls'][internalLog.name][date].count++
    }

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
}

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