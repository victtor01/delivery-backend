import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [UsersModule, ConfigModule.forRoot(), AuthModule, StoreModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
