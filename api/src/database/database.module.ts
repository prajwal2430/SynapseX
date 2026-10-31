import { Module, Logger, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongoDB');
        const uri = configService.get<string>('database.uri');
        const options = configService.get('database.options');

        return {
          uri,
          ...options,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log('✅ MongoDB connection established successfully');
            });
            connection.on('disconnected', () => {
              logger.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
            });
            connection.on('reconnected', () => {
              logger.log('🔄 MongoDB reconnected successfully');
            });
            connection.on('error', (error: Error) => {
              logger.error(`❌ MongoDB connection error: ${error.message}`);
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
