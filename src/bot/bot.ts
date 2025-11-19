/**
 * Bot de Telegram - Configuración principal
 */
import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import { createLogger } from '../utils/logger';

// Commands
import { startCommand } from './commands/start.command';
import { cruceCommand } from './commands/cruce.command';

// Handlers
import { documentHandler } from './handlers/document.handler';
import { textHandler } from './handlers/text.handler';

// Middleware
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';

const logger = createLogger({ module: 'bot' });

export class TelegramBot {
  private bot: Telegraf;

  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.setupMiddleware();
    this.setupCommands();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Configura los middleware
   */
  private setupMiddleware(): void {
    this.bot.use(loggerMiddleware);
  }

  /**
   * Configura los comandos
   */
  private setupCommands(): void {
    this.bot.command('start', startCommand);
    this.bot.command('cruce', cruceCommand);

    logger.info('Commands registered');
  }

  /**
   * Configura los handlers
   */
  private setupHandlers(): void {
    // Handler para documentos
    this.bot.on('document', documentHandler);

    // Handler para mensajes de texto (botones)
    this.bot.on('text', textHandler);

    logger.info('Handlers registered');
  }

  /**
   * Configura el manejo de errores
   */
  private setupErrorHandling(): void {
    this.bot.catch((err: unknown, ctx) => errorMiddleware(err as Error, ctx));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', new Error(String(reason)));
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      // En producción, podrías querer cerrar gracefully
      if (config.isProduction) {
        process.exit(1);
      }
    });

    logger.info('Error handling configured');
  }

  /**
   * Inicia el bot
   */
  async launch(): Promise<void> {
    try {
      logger.info('Starting bot...');

      // Obtener información del bot
      const botInfo = await this.bot.telegram.getMe();
      logger.info(`Bot started successfully: @${botInfo.username}`, {
        botId: botInfo.id,
        botName: botInfo.first_name,
      });

      // Launch bot
      await this.bot.launch();

      logger.info('Bot is now running and listening for updates');

      // Graceful stop
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
    } catch (error) {
      logger.error('Failed to start bot', error as Error);
      throw error;
    }
  }

  /**
   * Detiene el bot gracefully
   */
  private stop(signal: string): void {
    logger.info(`${signal} received, stopping bot...`);
    this.bot.stop(signal);
    logger.info('Bot stopped');
    process.exit(0);
  }

  /**
   * Obtiene la instancia del bot
   */
  getBot(): Telegraf {
    return this.bot;
  }
}

export default TelegramBot;
