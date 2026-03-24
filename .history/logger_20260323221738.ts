import pino from 'pino';

const streams = [
  { level: 'trace', stream: process.stdout },
  { level: 'trace', stream: pino.destination('logs/server-log') },
];

const logger =
  process.env.LOG_TO_CONSOLE_ONLY === 'true'
    ? pino({ level: process.env.PINO_LOG_LEVEL || 'info' })
    : pino({ level: 'info' }, pino.multistream(streams));

export default logger;