import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { config } from './env';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

function buildLogger(): winston.Logger {
  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // lets logger.error(err) capture err.stack correctly
    config.env === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  );

  if (config.env === 'production') {
    fs.mkdirSync(LOG_DIR, { recursive: true }); // don't let "directory doesn't exist" be a failure mode
  }

  return winston.createLogger({
    level: config.env === 'production' ? 'info' : 'debug',
    format,
    transports: [
      config.env === 'production' ? new winston.transports.File({ filename: LOG_FILE }) : new winston.transports.Console(),
    ],
  });
}

// CommonJS caches this module by resolved path — this body runs once; every importer shares this instance.
export const logger: winston.Logger = (() => {
  try {
    return buildLogger();
  } catch (err) {
    console.error('Logger initialization failed, falling back to console-only logging:', err);
    return winston.createLogger({ level: 'debug', transports: [new winston.transports.Console()] });
  }
})();

function formatArgs(args: unknown[]): string | Error {
  if (args.length === 1 && args[0] instanceof Error) {
    return args[0];
  }
  return args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
}

console.log = (...args: unknown[]): void => void logger.info(formatArgs(args));
console.error = (...args: unknown[]): void => void logger.error(formatArgs(args));
console.warn = (...args: unknown[]): void => void logger.warn(formatArgs(args));
