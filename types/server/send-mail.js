'use strict';

/**
 * Dependencies
 */
const ServerError = require('../server');

/**
 * Constructor
 */
function SendMailError(message, data) {
  ServerError.call(this, message, data);
}

/**
 * Extend prototype
 */
SendMailError.prototype = Object.create(ServerError.prototype);
SendMailError.prototype.constructor = SendMailError;
SendMailError.prototype.name = 'SendMailError';
SendMailError.prototype.code = 'MAILER_ERROR';

//Export
module.exports = SendMailError;
