/**
 * Handler para mensajes de texto (botones del teclado)
 */
import { Context } from 'telegraf';
import { KEYBOARD_BUTTONS } from '../../utils/constants';
import { startCommand } from '../commands/start.command';
import { cruceCommand } from '../commands/cruce.command';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ handler: 'text' });

export async function textHandler(ctx: Context): Promise<void> {
  try {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text;

    // Manejar botones del teclado
    switch (text) {
      case KEYBOARD_BUTTONS.REALIZAR_CRUCE:
        await cruceCommand(ctx);
        break;

      case KEYBOARD_BUTTONS.VOLVER_MENU:
        await startCommand(ctx);
        break;

      default:
        // Mensaje no reconocido
        logger.debug('Unrecognized message', { text });
        break;
    }
  } catch (error) {
    logger.error('Error in text handler', error as Error);
  }
}
