export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private isDevelopment = import.meta.env.DEV;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isDevelopment && level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} [${level}]${ctx} ${message}`;
  }

  debug(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context), ...args);
    }
  }

  info(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context), ...args);
    }
  }

  warn(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context), ...args);
    }
  }

  error(message: string, context?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context), ...args);
    }
  }

  trace(message: string, context?: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.trace(this.formatMessage('TRACE', message, context));
    }
  }

  group(label: string, collapsed = false) {
    if (this.isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

// Convenience functions for common contexts
export const apiLogger = {
  debug: (message: string, ...args: any[]) => logger.debug(message, 'API', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'API', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'API', ...args),
  error: (message: string, ...args: any[]) => logger.error(message, 'API', ...args)
};

export const storeLogger = {
  debug: (message: string, ...args: any[]) => logger.debug(message, 'STORE', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'STORE', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'STORE', ...args),
  error: (message: string, ...args: any[]) => logger.error(message, 'STORE', ...args)
};

export const componentLogger = {
  debug: (message: string, ...args: any[]) => logger.debug(message, 'COMPONENT', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'COMPONENT', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'COMPONENT', ...args),
  error: (message: string, ...args: any[]) => logger.error(message, 'COMPONENT', ...args)
};