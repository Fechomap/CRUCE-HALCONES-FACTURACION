/**
 * Comando /start
 */
import { Context, Markup } from 'telegraf';
import { MESSAGES, KEYBOARD_BUTTONS, EMOJI } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ command: 'start' });

export async function startCommand(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username || ctx.from?.first_name || 'Usuario';

    logger.logUserAction(userId || 0, 'start', { username });

    await ctx.reply(`${EMOJI.ROCKET} Hola, *${username}*!\n\n${MESSAGES.WELCOME}`, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([[KEYBOARD_BUTTONS.REALIZAR_CRUCE]])
        .resize()
        .persistent(),
    });
  } catch (error) {
    logger.error('Error in start command', error as Error);
    await ctx.reply(`${EMOJI.ERROR} Ocurrió un error. Por favor intenta nuevamente.`);
  }
}
