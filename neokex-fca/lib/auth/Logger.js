"use strict";

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.logFilePath = options.logFilePath || path.join(process.cwd(), 'neokex-fca.log');
    this.colorize = options.colorize !== false;
    this.prefix = options.prefix || '[NeoKEX-FCA]';
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.colors = {
      error: chalk.hex('#ef4444').bold,
      warn: chalk.hex('#f59e0b'),
      info: chalk.hex('#3b82f6'),
      debug: chalk.hex('#6b7280'),
      trace: chalk.hex('#8b5cf6')
    };
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  _formatMessage(level, context, message, data) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    return `${timestamp} ${levelStr} ${this.prefix} ${contextStr} ${message}${dataStr}`;
  }

  _log(level, context, message, data) {
    if (!this._shouldLog(level)) return;

    const formattedMessage = this._formatMessage(level, context, message, data);

    if (this.enableConsole) {
      const colorFn = this.colorize && this.colors[level] ? this.colors[level] : (x) => x;
      console.log(colorFn(formattedMessage));
    }

    if (this.enableFile) {
      try {
        fs.appendFileSync(this.logFilePath, formattedMessage + '\n');
      } catch (err) {
        console.error('Failed to write to log file:', err.message);
      }
    }
  }

  error(context, message, data) {
    this._log('error', context, message, data);
  }

  warn(context, message, data) {
    this._log('warn', context, message, data);
  }

  info(context, message, data) {
    this._log('info', context, message, data);
  }

  debug(context, message, data) {
    this._log('debug', context, message, data);
  }

  trace(context, message, data) {
    this._log('trace', context, message, data);
  }

  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    } else {
      this.warn('Logger', `Invalid log level: ${level}`);
    }
  }

  clearLogFile() {
    if (this.enableFile) {
      try {
        fs.writeFileSync(this.logFilePath, '');
      } catch (err) {
        console.error('Failed to clear log file:', err.message);
      }
    }
  }
}

module.exports = Logger;
