import log4js from 'log4js';

export function configureLogger(appName: string, level: string = 'info') {
  log4js.configure({
    appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: `${appName}.log` },
    },
    categories: {
      default: { appenders: ['out', 'app'], level },
    },
  });
}
