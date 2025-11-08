"use strict";

const { AuthenticationError, ValidationError } = require('./errors');

class SessionValidator {
  constructor(logger) {
    this.logger = logger;
  }

  validateAppState(appState) {
    if (!appState) {
      throw new ValidationError('AppState is required for authentication', {
        field: 'appState',
        received: typeof appState
      });
    }

    if (typeof appState === 'string') {
      const cookies = appState.split(';').map(s => s.trim()).filter(Boolean);
      if (cookies.length === 0) {
        throw new ValidationError('AppState string is empty or invalid', {
          field: 'appState',
          format: 'string'
        });
      }
      return { valid: true, format: 'string', cookieCount: cookies.length };
    }

    if (Array.isArray(appState)) {
      if (appState.length === 0) {
        throw new ValidationError('AppState array is empty', {
          field: 'appState',
          format: 'array'
        });
      }

      const requiredCookies = ['c_user', 'xs'];
      const cookieKeys = appState.map(c => c.name || c.key);
      const missingCookies = requiredCookies.filter(req => !cookieKeys.includes(req));

      if (missingCookies.length > 0) {
        this.logger && this.logger.warn('SessionValidator', 
          `Missing recommended cookies: ${missingCookies.join(', ')}`);
      }

      const hasUserId = cookieKeys.includes('c_user');
      const hasSessionToken = cookieKeys.includes('xs') || cookieKeys.includes('fr');

      if (!hasUserId) {
        throw new ValidationError('AppState must contain c_user cookie', {
          field: 'appState',
          missing: 'c_user'
        });
      }

      if (!hasSessionToken) {
        throw new ValidationError('AppState must contain xs or fr cookie', {
          field: 'appState',
          missing: 'xs or fr'
        });
      }

      return {
        valid: true,
        format: 'array',
        cookieCount: appState.length,
        hasUserId,
        hasSessionToken,
        cookies: cookieKeys
      };
    }

    throw new ValidationError('AppState must be a string or array', {
      field: 'appState',
      received: typeof appState
    });
  }

  validateCredentials(credentials) {
    if (!credentials) {
      throw new ValidationError('Credentials object is required', {
        field: 'credentials',
        received: typeof credentials
      });
    }

    if (credentials.appState) {
      return this.validateAppState(credentials.appState);
    }

    if (credentials.email && credentials.password) {
      if (typeof credentials.email !== 'string' || credentials.email.length === 0) {
        throw new ValidationError('Email must be a non-empty string', {
          field: 'email'
        });
      }

      if (typeof credentials.password !== 'string' || credentials.password.length === 0) {
        throw new ValidationError('Password must be a non-empty string', {
          field: 'password'
        });
      }

      return { valid: true, method: 'email_password' };
    }

    throw new ValidationError('Credentials must contain either appState or email/password', {
      field: 'credentials',
      provided: Object.keys(credentials)
    });
  }

  getDiagnostics(appState) {
    try {
      const validation = this.validateAppState(appState);
      return {
        status: 'valid',
        details: validation
      };
    } catch (error) {
      return {
        status: 'invalid',
        error: error.message,
        code: error.code,
        details: error.details
      };
    }
  }
}

module.exports = SessionValidator;
