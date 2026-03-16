/**
 * Simple logging utility for the SuperStack SDK
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];

  private readonly levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(logLevel: LogLevel = "info") {
    this.logLevel = logLevel;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Log message
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (this.levelOrder[level] >= this.levelOrder[this.logLevel]) {
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message,
        context,
      };

      this.logs.push(entry);
      this.printLog(entry);
    }
  }

  /**
   * Print log entry to console
   */
  private printLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = entry.level.toUpperCase().padEnd(5);

    let output = `[${timestamp}] ${levelStr}: ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    switch (entry.level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs as JSON
   */
  toJSON(): LogEntry[] {
    return this.logs;
  }
}

// Global logger instance
let globalLogger: Logger;

/**
 * Get or create global logger
 */
export function getLogger(level?: LogLevel): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(level || "info");
  }
  return globalLogger;
}

/**
 * Create a scoped logger
 */
export function createScopedLogger(scope: string): Logger {
  const baseLogger = getLogger();
  const scopedLogger = new Logger();

  // Override log methods to add scope
  const originalDebug = scopedLogger.debug.bind(scopedLogger);
  const originalInfo = scopedLogger.info.bind(scopedLogger);
  const originalWarn = scopedLogger.warn.bind(scopedLogger);
  const originalError = scopedLogger.error.bind(scopedLogger);

  scopedLogger.debug = (message: string, context?: Record<string, unknown>) => {
    originalDebug(`[${scope}] ${message}`, context);
  };

  scopedLogger.info = (message: string, context?: Record<string, unknown>) => {
    originalInfo(`[${scope}] ${message}`, context);
  };

  scopedLogger.warn = (message: string, context?: Record<string, unknown>) => {
    originalWarn(`[${scope}] ${message}`, context);
  };

  scopedLogger.error = (message: string, context?: Record<string, unknown>) => {
    originalError(`[${scope}] ${message}`, context);
  };

  return scopedLogger;
}
