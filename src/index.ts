/**
 * Punto de entrada principal de la aplicación
 */
import fs from 'fs';
import { config } from './config/config';
import { TelegramBot } from './bot/bot';
import { createLogger } from './utils/logger';
import { APP_NAME, APP_VERSION } from './utils/constants';

const logger = createLogger({ module: 'main' });

/**
 * Inicializa directorios necesarios
 */
async function initializeDirectories(): Promise<void> {
  const directories = [config.tempDir, config.logsDir];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ${APP_NAME} - v${APP_VERSION}`);
    console.log('  Sistema de Cruce de Facturación Automático');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    logger.info('Application starting', {
      version: APP_VERSION,
      nodeEnv: config.nodeEnv,
      nodeVersion: process.version,
    });

    // Inicializar directorios
    await initializeDirectories();

    // Crear e iniciar el bot
    const bot = new TelegramBot();
    await bot.launch();

    console.log('');
    console.log('✅ Bot iniciado exitosamente');
    console.log('📡 Esperando mensajes...');
    console.log('');
    console.log('Presiona Ctrl+C para detener el bot');
    console.log('');
  } catch (error) {
    logger.error('Fatal error during startup', error as Error);
    console.error('❌ Error fatal al iniciar la aplicación:');
    console.error((error as Error).message);
    console.error('');
    console.error('Por favor revisa los logs para más detalles.');
    process.exit(1);
  }
}

// Ejecutar aplicación
main();
