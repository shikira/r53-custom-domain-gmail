import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    logger = new Logger('test');
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log info message', () => {
    logger.info('test message', { key: 'value' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"info"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"test message"')
    );
  });

  it('should log error message', () => {
    logger.error('error message', new Error('test error'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"error"')
    );
  });
});
