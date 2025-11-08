"use strict";

class PluginManager {
  constructor(logger) {
    this.plugins = new Map();
    this.middlewares = [];
    this.logger = logger;
  }

  register(name, plugin) {
    if (typeof plugin !== 'function' && typeof plugin !== 'object') {
      throw new Error('Plugin must be a function or object with an execute method');
    }

    if (this.plugins.has(name)) {
      this.logger && this.logger.warn('PluginManager', `Plugin "${name}" already registered, overwriting`);
    }

    this.plugins.set(name, plugin);
    this.logger && this.logger.info('PluginManager', `Registered plugin: ${name}`);

    if (typeof plugin.init === 'function') {
      plugin.init();
    }

    return this;
  }

  unregister(name) {
    const plugin = this.plugins.get(name);
    
    if (plugin && typeof plugin.destroy === 'function') {
      plugin.destroy();
    }

    const removed = this.plugins.delete(name);
    
    if (removed) {
      this.logger && this.logger.info('PluginManager', `Unregistered plugin: ${name}`);
    }

    return removed;
  }

  get(name) {
    return this.plugins.get(name);
  }

  has(name) {
    return this.plugins.has(name);
  }

  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }

    this.middlewares.push(middleware);
    this.logger && this.logger.info('PluginManager', 'Added middleware function');

    return this;
  }

  async executeMiddlewares(event, context) {
    let processedEvent = event;

    for (const middleware of this.middlewares) {
      try {
        const result = await middleware(processedEvent, context);
        
        if (result === false) {
          this.logger && this.logger.debug('PluginManager', 'Middleware chain stopped');
          return null;
        }

        if (result !== undefined && result !== true) {
          processedEvent = result;
        }

      } catch (error) {
        this.logger && this.logger.error('PluginManager', 'Middleware error', {
          error: error.message
        });
        throw error;
      }
    }

    return processedEvent;
  }

  async execute(pluginName, ...args) {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    if (typeof plugin === 'function') {
      return await plugin(...args);
    }

    if (typeof plugin.execute === 'function') {
      return await plugin.execute(...args);
    }

    throw new Error(`Plugin "${pluginName}" does not have an execute method`);
  }

  listPlugins() {
    return Array.from(this.plugins.keys());
  }

  clear() {
    this.plugins.forEach((plugin, name) => {
      if (typeof plugin.destroy === 'function') {
        plugin.destroy();
      }
    });

    this.plugins.clear();
    this.middlewares = [];
    this.logger && this.logger.info('PluginManager', 'Cleared all plugins and middlewares');
  }
}

module.exports = PluginManager;
