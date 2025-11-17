/**
 * Comando /help
 */
import { Context, Markup } from 'telegraf';
import { MESSAGES, KEYBOARD_BUTTONS, EMOJI } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ command: 'help' });

export async function helpCommand(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    logger.logUserAction(userId || 0, 'help');

    await ctx.reply(MESSAGES.HELP, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([[KEYBOARD_BUTTONS.VOLVER_MENU]])
        .resize()
        .persistent(),
    });
  } catch (error) {
    logger.error('Error in help command', error as Error);
    await ctx.reply(`${EMOJI.ERROR} Ocurrió un error. Por favor intenta nuevamente.`);
  }
}
