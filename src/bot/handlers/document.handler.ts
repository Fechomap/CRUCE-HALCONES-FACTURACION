/**
 * Handler para documentos (archivos Excel)
 * FLUJO: Usuario envía Excel 1 (Facturación) → Excel 2 (Base) → Bot cruza 1→2 → Retorna Excel 2 actualizado
 */
import { Context } from 'telegraf';
import { Message } from 'telegraf/types';
import { Input, Markup } from 'telegraf';
import path from 'path';
import fs from 'fs/promises';
import { userStates } from '../commands/cruce.command';
import { validationService } from '../../services/validation.service';
import { matchingService } from '../../services/matching.service';
import { reportService } from '../../services/report.service';
import { config } from '../../config/config';
import { createLogger } from '../../utils/logger';
import { generateId, getFileExtension, formatBytes } from '../../utils/helpers';
import { EMOJI, MESSAGES, KEYBOARD_BUTTONS } from '../../utils/constants';

const logger = createLogger({ handler: 'document' });

export async function documentHandler(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = userStates.get(userId);

    // Verificar si el usuario está en un proceso de cruce
    if (!userState || !userState.waitingFor) {
      await ctx.reply(
        `${EMOJI.INFO} Para realizar un cruce, primero usa el botón "${KEYBOARD_BUTTONS.REALIZAR_CRUCE}" o el comando /cruce`,
        {
          ...Markup.keyboard([[KEYBOARD_BUTTONS.REALIZAR_CRUCE], [KEYBOARD_BUTTONS.VOLVER_MENU]])
            .resize()
            .persistent(),
        }
      );
      return;
    }

    const message = ctx.message as Message.DocumentMessage;
    const document = message.document;

    if (!document || !document.file_name || !document.file_size) {
      await ctx.reply(`${EMOJI.ERROR} No se pudo procesar el archivo.`);
      return;
    }

    const fileName = document.file_name;
    const fileSize = document.file_size;

    logger.logFileProcessing(fileName, fileSize, userId);

    // Validar tamaño
    const sizeValidation = validationService.validateFileSize(fileSize, config.maxFileSizeBytes);

    if (!sizeValidation.valid) {
      await ctx.reply(`${MESSAGES.FILE_TOO_LARGE}\n\nTamaño recibido: ${formatBytes(fileSize)}`);
      return;
    }

    // Validar extensión
    const extValidation = validationService.validateFileExtension(
      fileName,
      config.allowedFileTypes
    );

    if (!extValidation.valid) {
      await ctx.reply(MESSAGES.INVALID_FORMAT);
      return;
    }

    // Descargar archivo
    try {
      const fileLink = await ctx.telegram.getFileLink(document.file_id);
      const fileId = generateId();
      const fileExt = getFileExtension(fileName);
      const tempFilePath = path.join(config.tempDir, `${userState.waitingFor}_${fileId}${fileExt}`);

      // Crear directorio temporal si no existe
      await fs.mkdir(config.tempDir, { recursive: true });

      // Descargar archivo
      const response = await fetch(fileLink.href);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(tempFilePath, Buffer.from(buffer));

      logger.info('File downloaded successfully', {
        userId,
        tempFilePath,
        waitingFor: userState.waitingFor,
      });

      // Procesar según el archivo que estamos esperando
      if (userState.waitingFor === 'archivo1') {
        await handleArchivo1(ctx, userId, tempFilePath, fileName);
      } else if (userState.waitingFor === 'archivo2') {
        await handleArchivo2(ctx, userId, tempFilePath, fileName);
      }
    } catch (error) {
      logger.error('Error processing file', error as Error, { userId });
      await ctx.reply(`${MESSAGES.ERROR}\n\nError: ${(error as Error).message}`);
      userStates.delete(userId);
    }
  } catch (error) {
    logger.error('Error in document handler', error as Error);
    await ctx.reply(MESSAGES.ERROR);
  }
}

/**
 * Maneja el primer archivo (Facturación)
 */
async function handleArchivo1(
  ctx: Context,
  userId: number,
  filePath: string,
  fileName: string
): Promise<void> {
  const userState = userStates.get(userId);
  if (!userState) return;

  const validationMsg = await ctx.reply(`${EMOJI.PROCESSING} Validando archivo de facturación...`);

  try {
    // Validar estructura
    const validation = await validationService.validateFacturacionFile(filePath);

    if (!validation.valid) {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        validationMsg.message_id,
        undefined,
        `${EMOJI.ERROR} *Archivo de facturación inválido*\n\n${validation.errors.slice(0, 5).join('\n')}`,
        { parse_mode: 'Markdown' }
      );

      await fs.unlink(filePath);
      userStates.delete(userId);
      return;
    }

    // Guardar path del archivo 1
    userState.archivo1 = filePath;
    userState.waitingFor = 'archivo2';
    userStates.set(userId, userState);

    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      validationMsg.message_id,
      undefined,
      `${EMOJI.SUCCESS} Archivo de facturación recibido: *${fileName}*`,
      { parse_mode: 'Markdown' }
    );

    // Pedir el segundo archivo
    await ctx.reply(
      `${EMOJI.ROCKET} *PASO 2/2: Envía el Excel BASE*\n\n` +
        `Este es el archivo donde se cruzará la información del archivo anterior.\n\n` +
        `${EMOJI.INFO} Este archivo debe tener las columnas de la base operativa.\n\n` +
        `📎 Formato: .xlsx | Máx: 10MB`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([[KEYBOARD_BUTTONS.VOLVER_MENU]])
          .resize()
          .persistent(),
      }
    );

    logger.info('Archivo 1 validated, waiting for archivo 2', { userId });
  } catch (error) {
    logger.error('Error validating archivo 1', error as Error, { userId });
    await ctx.reply(`${EMOJI.ERROR} Error al validar el archivo: ${(error as Error).message}`);
    await fs.unlink(filePath);
    userStates.delete(userId);
  }
}

/**
 * Maneja el segundo archivo (Base) y ejecuta el cruce
 */
async function handleArchivo2(
  ctx: Context,
  userId: number,
  filePath: string,
  fileName: string
): Promise<void> {
  const userState = userStates.get(userId);
  if (!userState || !userState.archivo1) {
    await ctx.reply(
      `${EMOJI.ERROR} Error: No se encontró el archivo de facturación. Inicia de nuevo con /cruce`
    );
    await fs.unlink(filePath);
    userStates.delete(userId);
    return;
  }

  const processingMsg = await ctx.reply(`${EMOJI.PROCESSING} Validando archivo base...`);

  try {
    // Validar archivo base
    const validation = await validationService.validateCotejoFile(filePath);

    if (!validation.valid) {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        processingMsg.message_id,
        undefined,
        `${EMOJI.ERROR} *Archivo base inválido*\n\n${validation.errors.join('\n')}`,
        { parse_mode: 'Markdown' }
      );

      await fs.unlink(filePath);
      await fs.unlink(userState.archivo1);
      userStates.delete(userId);
      return;
    }

    // Archivo 2 OK, guardar
    userState.archivo2 = filePath;
    userStates.set(userId, userState);

    // Realizar cruce
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      processingMsg.message_id,
      undefined,
      `${EMOJI.SUCCESS} Archivo base recibido: *${fileName}*\n\n` +
        `${EMOJI.PROCESSING} Realizando cruce de información...\n\n` +
        `Esto puede tomar un momento.`,
      { parse_mode: 'Markdown' }
    );

    logger.info('Starting cruce process', {
      userId,
      archivo1: userState.archivo1,
      archivo2: userState.archivo2,
    });

    // Ejecutar cruce: archivo1 (facturación) → archivo2 (base)
    const report = await matchingService.ejecutarCruce(userState.archivo1, userState.archivo2);

    // Generar archivos de salida
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      processingMsg.message_id,
      undefined,
      `${EMOJI.PROCESSING} Generando archivos de salida...`,
      { parse_mode: 'Markdown' }
    );

    const outputBasePath = path.join(
      config.tempDir,
      `BASE_ACTUALIZADA_${userId}_${generateId()}.xlsx`
    );
    const outputReportPath = path.join(config.tempDir, `REPORTE_${userId}_${generateId()}.txt`);

    await matchingService.guardarBaseActualizada(outputBasePath);
    await reportService.guardarReporte(report, outputReportPath);

    // Enviar resumen
    const reportTelegram = reportService.generarReporteTelegram(report);
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      processingMsg.message_id,
      undefined,
      reportTelegram,
      { parse_mode: 'Markdown' }
    );

    // Enviar archivo base actualizado (IMPORTANTE: Solo el archivo 2 actualizado)
    await ctx.replyWithDocument(Input.fromLocalFile(outputBasePath));

    // Enviar reporte detallado
    await ctx.replyWithDocument(Input.fromLocalFile(outputReportPath));

    // Proceso completado
    await ctx.reply(`${EMOJI.SUCCESS} Proceso completado exitosamente`, {
      ...Markup.keyboard([[KEYBOARD_BUTTONS.REALIZAR_CRUCE], [KEYBOARD_BUTTONS.VOLVER_MENU]])
        .resize()
        .persistent(),
    });

    // Limpiar archivos temporales
    await fs.unlink(userState.archivo1);
    await fs.unlink(userState.archivo2);
    // Los archivos de salida se mantienen temporalmente para /reporte

    logger.info('Cruce completed successfully', {
      userId,
      processedCount: report.stats.processedCount,
      matchedCount: report.stats.matchedCount,
    });

    // Limpiar estado del usuario
    userStates.delete(userId);
  } catch (error) {
    logger.error('Error processing archivo 2 and cruce', error as Error, { userId });

    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      processingMsg.message_id,
      undefined,
      `${MESSAGES.ERROR}\n\nError: ${(error as Error).message}`
    );

    // Limpiar archivos temporales
    if (userState.archivo1) await fs.unlink(userState.archivo1).catch(() => {});
    if (userState.archivo2) await fs.unlink(userState.archivo2).catch(() => {});

    userStates.delete(userId);
  }
}
