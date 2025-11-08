"use strict";

const axios = require('axios');
const EventEmitter = require('events');

class WebhookManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.webhooks = [];
    this.enabled = options.enabled !== false;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 5000;
    this.logger = options.logger;
  }

  addWebhook(url, options = {}) {
    const webhook = {
      url,
      method: options.method || 'POST',
      headers: options.headers || {},
      events: options.events || ['*'],
      enabled: options.enabled !== false,
      secret: options.secret,
      id: Date.now() + Math.random()
    };

    this.webhooks.push(webhook);
    this.logger && this.logger.info('WebhookManager', `Added webhook: ${url}`);
    return webhook.id;
  }

  removeWebhook(id) {
    const initialLength = this.webhooks.length;
    this.webhooks = this.webhooks.filter(w => w.id !== id);
    const removed = this.webhooks.length < initialLength;
    
    if (removed) {
      this.logger && this.logger.info('WebhookManager', `Removed webhook: ${id}`);
    }
    
    return removed;
  }

  async sendEvent(eventType, eventData) {
    if (!this.enabled || this.webhooks.length === 0) return;

    const relevantWebhooks = this.webhooks.filter(
      w => w.enabled && (w.events.includes('*') || w.events.includes(eventType))
    );

    const payload = {
      event: eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    };

    const promises = relevantWebhooks.map(webhook => 
      this._sendToWebhook(webhook, payload)
    );

    const results = await Promise.allSettled(promises);
    
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger && this.logger.warn('WebhookManager', 
        `${failures.length} webhook(s) failed for event: ${eventType}`);
    }

    return results;
  }

  async _sendToWebhook(webhook, payload, attempt = 1) {
    try {
      const headers = { ...webhook.headers };
      
      if (webhook.secret) {
        headers['X-Webhook-Secret'] = webhook.secret;
      }

      headers['Content-Type'] = 'application/json';
      headers['User-Agent'] = 'NeoKEX-FCA/2.0.0';

      const response = await axios({
        method: webhook.method,
        url: webhook.url,
        data: payload,
        headers,
        timeout: this.timeout
      });

      this.emit('webhook:success', {
        webhook: webhook.url,
        event: payload.event,
        status: response.status
      });

      return response;

    } catch (error) {
      this.logger && this.logger.error('WebhookManager', 
        `Failed to send to webhook: ${webhook.url}`, {
          error: error.message,
          attempt
        });

      if (attempt < this.retryAttempts) {
        await this._sleep(this.retryDelay * attempt);
        return this._sendToWebhook(webhook, payload, attempt + 1);
      }

      this.emit('webhook:error', {
        webhook: webhook.url,
        event: payload.event,
        error: error.message,
        attempts: attempt
      });

      throw error;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getWebhooks() {
    return this.webhooks.map(w => ({
      id: w.id,
      url: w.url,
      method: w.method,
      events: w.events,
      enabled: w.enabled
    }));
  }

  enableAll() {
    this.webhooks.forEach(w => w.enabled = true);
    this.enabled = true;
  }

  disableAll() {
    this.webhooks.forEach(w => w.enabled = false);
    this.enabled = false;
  }
}

module.exports = WebhookManager;
