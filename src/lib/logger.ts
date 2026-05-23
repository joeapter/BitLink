// Structured logger — server-side only.
// Outputs JSON in production, pretty-printed in development.
// Do not import from client components or edge middleware.

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export type Logger = typeof logger;
