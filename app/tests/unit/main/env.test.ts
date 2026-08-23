import { parseEnv, config } from '../../../src/main/env';

describe('config', () => {
  test('databaseUri is assembled from this environment\'s DB_* variables', () => {
    const expected = `postgresql://${encodeURIComponent(process.env.DB_USER!)}:${encodeURIComponent(process.env.DB_PASSWORD!)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    expect(config.databaseUri).toBe(expected);
  });

  test('apiPrefix is the firewall API base path', () => {
    expect(config.apiPrefix).toBe('/api/firewall');
  });
});

describe('parseEnv', () => {
  const validEnv = {
    ENV: 'dev',
    PORT: '3000',
    DB_HOST: 'other-host',
    DB_PORT: '6543',
    DB_USER: 'other-user',
    DB_PASSWORD: 'other-password',
    DB_NAME: 'other_db',
    DB_CONNECTION_INTERVAL: '500',
  };

  test('accepts a fully valid environment and coerces numeric fields, routing to the given DB host/name', () => {
    const result = parseEnv(validEnv);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DB_HOST).toBe('other-host');
      expect(result.data.DB_NAME).toBe('other_db');
      expect(result.data.PORT).toBe(3000);
    }
  });

  test('rejects an environment missing a required variable', () => {
    const { DB_HOST: _omit, ...missingDbHost } = validEnv;
    const result = parseEnv(missingDbHost);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'DB_HOST')).toBe(true);
    }
  });

  test('rejects a non-numeric PORT', () => {
    const result = parseEnv({ ...validEnv, PORT: 'not-a-number' });

    expect(result.success).toBe(false);
  });

  test('rejects an ENV value outside the dev/production enum', () => {
    const result = parseEnv({ ...validEnv, ENV: 'staging' });

    expect(result.success).toBe(false);
  });
});

describe('module load with an invalid process.env', () => {
  test('logs the issue list and exits the process, without crashing the test worker', () => {
    jest.resetModules();
    const originalEnv = process.env;
    const originalDbHost = originalEnv.DB_HOST;
    delete process.env.DB_HOST;

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => require('../../../src/main/env')).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith('Invalid environment configuration:');
    } finally {
      process.env.DB_HOST = originalDbHost;
      exitSpy.mockRestore();
      errorSpy.mockRestore();
      jest.resetModules();
      // Force one more clean evaluation with a valid environment so this
      // file's coverage instrumentation reflects the (far more common)
      // successful module-load path, not just the reset-modules failure case.
      require('../../../src/main/env');
    }
  });
});
