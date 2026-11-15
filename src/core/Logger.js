/**
 * Simple Logger utility to track application flow and catch errors.
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor() {
        this.level = LogLevel.DEBUG;
        this.buffer = [];
        this.bufferSize = 200;
    }

    setLevel(level) {
        this.level = level;
    }

    _formatMessage(levelStr, message, data) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        let dataStr = '';
        if (data !== undefined && data !== null) {
            try {
                dataStr = typeof data === 'object' ? ` | Data: ${JSON.stringify(data)}` : ` | Data: ${data}`;
            } catch (e) {
                dataStr = ` | Data: [Unserializable Object]`;
            }
        }
        const formatted = `[${timestamp}] [${levelStr}] ${message}${dataStr}`;
        this._addToBuffer(formatted);
        return formatted;
    }

    _addToBuffer(msg) {
        this.buffer.push(msg);
        if (this.buffer.length > this.bufferSize) {
            this.buffer.shift();
        }
    }

    getLogs() {
        return this.buffer.join('\n');
    }

    debug(message, data = null) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(this._formatMessage('DEBUG', message, data));
        } else {
            this._addToBuffer(this._formatMessage('DEBUG (HIDDEN)', message, data));
        }
    }

    info(message, data = null) {
        if (this.level <= LogLevel.INFO) {
            console.info(this._formatMessage('INFO', message, data));
        } else {
            this._addToBuffer(this._formatMessage('INFO (HIDDEN)', message, data));
        }
    }

    warn(message, data = null) {
        if (this.level <= LogLevel.WARN) {
            console.warn(this._formatMessage('WARN', message, data));
        } else {
            this._addToBuffer(this._formatMessage('WARN (HIDDEN)', message, data));
        }
    }

    error(message, error = null) {
        if (this.level <= LogLevel.ERROR) {
            console.error(this._formatMessage('ERROR', message));
            if (error) console.error(error);
        } else {
            this._addToBuffer(this._formatMessage('ERROR (HIDDEN)', message, error));
        }
    }
}

export const logger = new Logger();
