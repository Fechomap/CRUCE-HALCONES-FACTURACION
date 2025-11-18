/**
 * Middleware de manejo de errores
 */
import { Context } from 'telegraf';
import { createLogger } from '../../utils/logger';
import { EMOJI } from '../../utils/constants';

const logger = createLogger({ middleware: 'error' });

export async function errorMiddleware(err: Error, ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const updateType = ctx.updateType;

  logger.error('Bot error occurred', err, {
    userId,
    updateType,
    chatId: ctx.chat?.id,
  });

  try {
    await ctx.reply(
      `${EMOJI.ERROR} Ocurrió un error inesperado.\n\n` +
        `Por favor intenta nuevamente o contacta al soporte si el problema persiste.`
    );
  } catch (replyError) {
    logger.error('Failed to send error message to user', replyError as Error);
  }
}
