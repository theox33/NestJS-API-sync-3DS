import {
  Controller,
  Get,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { SavesService } from './saves.service';
import * as Express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const basePath = process.env.SAVES_BASE_PATH || '/mnt/3ds-saves';
    const gameId = req.body.gameId || 'unknown-game';
    const consoleId = req.body.consoleId || 'unknown-console';

    const dir = path.join(basePath, consoleId, gameId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const slot = req.body.slot || 'slot1';
    cb(null, `${slot}.sav`);
  },
});

@Controller('saves')
@UseGuards(ApiKeyGuard)
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadSave(
    @UploadedFile() file: Express.Multer.File,
    @Body('gameId') gameId: string,
    @Body('consoleId') consoleId: string,
    @Body('slot') slot: string,
  ) {
    return {
      message: 'Save uploaded',
      gameId,
      consoleId,
      slot,
      filename: file.filename,
      path: file.path,
    };
  }

  @Get('list')
  list(@Query('gameId') gameId?: string) {
    const files = this.savesService.listSaves(gameId);
    return { files };
  }

  @Get('download/:id')
  download(@Param('id') id: string, @Res() res: Express.Response) {
    const stream = this.savesService.getSaveStream(id);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(id)}"`);
    stream.pipe(res);
  }
}
