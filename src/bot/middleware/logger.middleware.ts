/**
 * Middleware de logging
 */
import { Context } from 'telegraf';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ middleware: 'logger' });

export async function loggerMiddleware(ctx: Context, next: () => Promise<void>): Promise<void> {
  const start = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name;
  const updateType = ctx.updateType;

  logger.debug('Incoming update', {
    userId,
    username,
    updateType,
    chatId: ctx.chat?.id,
  });

  await next();

  const duration = Date.now() - start;

  logger.debug('Update processed', {
    userId,
    updateType,
    duration: `${duration}ms`,
  });
}
