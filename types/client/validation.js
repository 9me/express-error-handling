'use strict';

/**
 * Dependencies
 */
const ClientError = require('../client');
const hop = function(arr, val) {
  return arr.indexOf(val) > -1;
};
const isUnDef = function(val) {
  return typeof val === 'undefined' || val === null;
};

const isNotNull = function(val) {
  return isUnDef(val) === false;
};

/**
 * Constructor
 */
function ValidationError(message, data, isTrivial = true) {

  //Object given?
  if (typeof message === 'object') {
    data = message;
    message = '';
  }

  //Mark triviality
  this.isTrivial = isTrivial;

  //Call parent constructor
  message = message || ValidationError.createMessage(data);
  ClientError.call(this, message, data, 422);
}

/**
 * Extend prototype
 */
ValidationError.prototype = Object.create(ClientError.prototype);
ValidationError.prototype.constructor = ValidationError;
ValidationError.prototype.name = 'ValidationError';
ValidationError.prototype.code = 'NOT_VALIDATED';
ValidationError.prototype.isTrivial = true;

/**
 * Static helper to create a summarized message from data
 */
ValidationError.createMessage = function(data) {

  //Initialize
  let message = 'Validation error';

  //No data or not the expected structure?
  if (!data || typeof data !== 'object' || !data.fields) {
    return message;
  }

  //Append fields
  const {fields} = data;
  for (const field in fields) {
    if (fields.hasOwnProperty(field)) {
      const {type, message: fieldMessage} = fields[field];
      message += `\n  - ${field}: ${fieldMessage} (${type})`;
    }
  }

  //Return
  return message;
};

/**
 * Static helper to convert from mongoose errors
 */
ValidationError.fromMongoose = function(mongooseError) {

  //Get info from error and initialize data
  const {message, errors} = mongooseError;
  const data = {fields: {}};

  //Initialize data for validation error
  for (const field in errors) {
    if (errors.hasOwnProperty(field)) {
      const {kind: type, message} = errors[field];
      data.fields[field] = {type, message};
    }
  }

  //Create new error
  return new ValidationError(message, data);
};

/**
 * Static helper to create from AJV
 * @param  {Array} errors AJV errors list
 */
ValidationError.fromAJV = function(errors) {
  //Get info from error and initialize data
  const msg = 'Invalid request data';
  const data = { fields: {} };
  errors = Array.isArray(errors) ? errors : [errors];

  //Initialize data for validation error
  errors.forEach((err) => {
    err.params = err.params || {};

    console.log(err);

    const name = err.params.missingProperty
      || err.dataPath && err.dataPath.match(/[a-zA-Z]+/g)[0]
      || err.params.additionalProperty
      ;
    if (
      hop(['required'], err.keyword) ||
      isNotNull(err.params.missingProperty)
    ) {
      const type = 'required';
      const message = `${name} is ${type}`;
      data.fields[name] = {type, message};
    }
    else if (err.keyword === 'additionalProperties') {
      data.fields[name] = {
        type: 'unknown',
        message: `${name} is not a known field`,
      };
    }
    else if (
      err.params.type || err.params.allowedValues
      || err.params.format
      || (err.keyword &&
        hop([
          'rid',
          'oneOf',
          'anyOf',
          'allOf',
          'pattern',
        ], err.keyword))
    ) {
      data.fields[name] = {
        type: 'invalid',
        message: `${name} is invalid`,
      };
    }
    else if (
      hop([
        'maxItems',
        'minItems',
        'maxLength',
        'minLength',
      ], err.keyword)) {
      data.fields[name] = {
        type: 'invalid',
        message: `${name} length is invalid`,
      };
    }
  });

  //Create new error
  return new ValidationError(msg, data);
};

//Export
module.exports = ValidationError;
