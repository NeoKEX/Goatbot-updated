"use strict";

const Logger = require('../utils/Logger');
const WebhookManager = require('../utils/WebhookManager');
const PluginManager = require('../utils/PluginManager');
const SessionValidator = require('./SessionValidator');
const { AuthenticationError } = require('../utils/errors');

const legacyClient = require('../legacy/core/client');

class NeoKEXClient {
  constructor(credentials, options = {}) {
    this.credentials = credentials;
    this.options = this._processOptions(options);
    this.logger = this.options.logger || new Logger(this.options.logging || {});
    this.webhook = null;
    this.plugins = null;
    this.validator = new SessionValidator(this.logger);
    
    if (this.options.validateSession !== false) {
      try {
        const validation = this.validator.validateCredentials(credentials);
        this.logger.info('NeoKEXClient', 'Session validation passed', validation);
      } catch (err) {
        this.logger.error('NeoKEXClient', 'Session validation failed', { error: err.message });
        throw err;
      }
    }
    
    if (this.options.webhook && this.options.webhook.enabled) {
      this.webhook = new WebhookManager({
        ...this.options.webhook,
        logger: this.logger
      });
      
      if (this.options.webhook.url) {
        this.webhook.addWebhook(this.options.webhook.url, {
          events: this.options.webhook.events || ['*'],
          secret: this.options.webhook.secret
        });
      }
    }
  }

  _processOptions(options) {
    const defaults = {
      selfListen: false,
      listenEvents: true,
      listenTyping: false,
      updatePresence: false,
      forceLogin: false,
      autoMarkDelivery: false,
      autoMarkRead: true,
      autoReconnect: true,
      online: true,
      emitReady: false,
      validateSession: true,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    };
    
    return { ...defaults, ...options };
  }

  connect(callback) {
    this.logger.info('NeoKEXClient', 'Initiating connection...');
    
    legacyClient.login(this.credentials, this.options, (err, api) => {
      if (err) {
        this.logger.error('NeoKEXClient', 'Connection failed', { error: err.message });
        return callback(new AuthenticationError('Failed to connect', { originalError: err }));
      }
      
      this.logger.info('NeoKEXClient', 'Successfully connected');
      
      this.plugins = new PluginManager(this.logger);
      api.plugins = this.plugins;
      api.logger = this.logger;
      api.webhook = this.webhook;
      
      if (this.webhook) {
        const originalListenMqtt = api.listenMqtt;
        api.listenMqtt = (callback) => {
          return originalListenMqtt.call(api, async (err, event) => {
            if (!err && event && this.webhook) {
              await this.webhook.sendEvent(event.type || 'unknown', event).catch(webhookErr => {
                this.logger.warn('NeoKEXClient', 'Webhook delivery failed', { error: webhookErr.message });
              });
            }
            
            if (this.plugins && event) {
              try {
                event = await this.plugins.executeMiddlewares(event, { api });
                if (event === null) return;
              } catch (middlewareErr) {
                this.logger.error('NeoKEXClient', 'Middleware error', { error: middlewareErr.message });
              }
            }
            
            callback(err, event);
          });
        };
      }
      
      callback(null, api);
    });
  }
}

module.exports = { NeoKEXClient };
