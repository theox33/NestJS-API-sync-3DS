import { Module } from '@nestjs/common';
import { SavesModule } from './saves/saves.module';

@Module({
  imports: [SavesModule],
})
export class AppModule {}
