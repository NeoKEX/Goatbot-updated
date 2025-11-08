"use strict";

class NeoKEXError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class AuthenticationError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'AUTH_ERROR', details);
  }
}

class NetworkError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', details);
  }
}

class RateLimitError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'RATE_LIMIT_ERROR', details);
  }
}

class ValidationError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

class MessageError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'MESSAGE_ERROR', details);
  }
}

class ConnectionError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'CONNECTION_ERROR', details);
  }
}

class TimeoutError extends NeoKEXError {
  constructor(message, details = {}) {
    super(message, 'TIMEOUT_ERROR', details);
  }
}

module.exports = {
  NeoKEXError,
  AuthenticationError,
  NetworkError,
  RateLimitError,
  ValidationError,
  MessageError,
  ConnectionError,
  TimeoutError
};
