/**
 * Comando /cruce
 */
import { Context, Markup } from 'telegraf';
import { KEYBOARD_BUTTONS, EMOJI } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ command: 'cruce' });

// Estado para tracking de archivos por usuario
interface UserFileState {
  archivo1?: string; // Path del Excel de facturación
  archivo2?: string; // Path del Excel base
  waitingFor: 'archivo1' | 'archivo2' | null;
}

export const userStates = new Map<number, UserFileState>();

export async function cruceCommand(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    logger.logUserAction(userId, 'cruce');

    // Inicializar estado del usuario
    userStates.set(userId, {
      waitingFor: 'archivo1',
    });

    await ctx.reply(
      `${EMOJI.ROCKET} *INICIAR CRUCE DE FACTURACIÓN*\n\n` +
      `📤 *PASO 1/2: Envía el Excel de FACTURACIÓN*\n\n` +
      `Este es el archivo que contiene los datos que se van a cruzar.\n\n` +
      `Debe contener las columnas:\n` +
      `• EXPEDIENTE\n` +
      `• Folio 1, Factura 1, Monto 1\n\n` +
      `📎 Formato: .xlsx | Máx: 10MB`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([[KEYBOARD_BUTTONS.VOLVER_MENU]])
          .resize()
          .persistent(),
      }
    );
  } catch (error) {
    logger.error('Error in cruce command', error as Error);
    await ctx.reply(`${EMOJI.ERROR} Ocurrió un error. Por favor intenta nuevamente.`);
  }
}
