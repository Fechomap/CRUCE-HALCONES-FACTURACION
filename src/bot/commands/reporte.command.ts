/**
 * Comando /reporte
 */
import { Context, Markup } from 'telegraf';
import { Input } from 'telegraf';
import path from 'path';
import fs from 'fs/promises';
import { MESSAGES, KEYBOARD_BUTTONS, EMOJI, OUTPUT_FILES } from '../../utils/constants';
import { config } from '../../config/config';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ command: 'reporte' });

export async function reporteCommand(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    logger.logUserAction(userId, 'reporte');

    // Buscar el último reporte generado en temp
    const reportPath = path.join(config.tempDir, OUTPUT_FILES.REPORTE_TEXTO);
    const basePath = path.join(config.tempDir, OUTPUT_FILES.BASE_ACTUALIZADA);

    try {
      // Verificar si existen los archivos
      await fs.access(reportPath);
      await fs.access(basePath);

      // Enviar el reporte de texto
      await ctx.replyWithDocument(Input.fromLocalFile(reportPath), {
        caption: `${EMOJI.DOCUMENT} Reporte de último cruce`,
        ...Markup.keyboard([[KEYBOARD_BUTTONS.VOLVER_MENU]])
          .resize()
          .persistent(),
      });

      // Enviar la base actualizada
      await ctx.replyWithDocument(Input.fromLocalFile(basePath), {
        caption: `${EMOJI.DOCUMENT} Base actualizada`,
      });

      logger.info('Reports sent successfully', { userId });
    } catch (error) {
      // No hay reportes disponibles
      await ctx.reply(MESSAGES.NO_REPORT, {
        ...Markup.keyboard([[KEYBOARD_BUTTONS.REALIZAR_CRUCE], [KEYBOARD_BUTTONS.VOLVER_MENU]])
          .resize()
          .persistent(),
      });
    }
  } catch (error) {
    logger.error('Error in reporte command', error as Error);
    await ctx.reply(`${EMOJI.ERROR} Ocurrió un error. Por favor intenta nuevamente.`);
  }
}
