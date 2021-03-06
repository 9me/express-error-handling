'use strict';

/**
 * Dependencies
 */
const types = require('../types');
const BaseError = types.BaseError;
const ServerError = types.ServerError;
const InternalError = types.InternalError;
const ValidationError = types.ValidationError;

/**
 * Try to load mongoose
 */
let MongooseError;
try {
  MongooseError = require('mongoose').Error.ValidationError;
}
catch (e) {
  MongooseError = null;
}

/**
 * Module export
 */
module.exports = function(error, req, res, next) {

  //If this is not an object yet at this stage, create an error representation
  if (typeof error !== 'object') {
    error = new ServerError(String(error));
  }

  //Wrap internal errors
  if (isInternalError(error)) {
    error = new InternalError(error);
  }

  //Convert mongoose validation errors
  if (isMongooseError(error)) {
    error = ValidationError.fromMongoose(error);
  }

  //Still not an instance of BaseError at this stage?
  if (!(error instanceof BaseError)) {
    error = new BaseError(error);
  }

  //Ensure that error.message is enumerable
  Object.defineProperty(error, 'message', {
    enumerable: true,
  });

  //Call next middleware
  next(error);
};

/**
 * Check if mongoose validation error
 */
function isMongooseError(error) {
  return (MongooseError && error instanceof MongooseError);
}

/**
 * Check if internal error
 */
function isInternalError(error) {
  if (error instanceof EvalError) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof RangeError) {
    return true;
  }
  if (error instanceof ReferenceError) {
    return true;
  }
  if (error instanceof SyntaxError) {
    return true;
  }
  if (error instanceof URIError) {
    return true;
  }
  return false;
}
