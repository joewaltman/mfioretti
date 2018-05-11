import logger from '../logger';
import grayLogFromat from './graylogFormat';
import terminalFormat from './terminalFormat';
import db from '../db';

export default (data, type = 'terminal') => {
    // Add to database
    db.addEntryToDatabase(data)

    switch (type) {
        case 'terminal':
            logger.log('info', terminalFormat(data));
            break;
        case 'graylog':
            logger.log('info', JSON.stringify(grayLogFromat(data.transaction,
                data.decodedInputDataResult, data.decodedLogs)));
            break;
        default:
            throw new Error(`${type} output module is undefind`);
    }
};