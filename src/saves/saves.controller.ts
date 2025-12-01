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
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const basePath = process.env.SAVES_BASE_PATH || '/mnt/3ds-saves';
    const dir = path.join(basePath, 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Nom temporaire unique
    cb(null, Date.now() + '-' + file.originalname);
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
    @UploadedFile() file: any,
    @Body('gameId') gameId: string,
    @Body('consoleId') consoleId: string,
    @Body('slot') slot: string,
  ) {
    const basePath = process.env.SAVES_BASE_PATH || '/mnt/3ds-saves';

    const safeGameId = gameId || 'unknown-game';
    const safeConsoleId = consoleId || 'unknown-console';
    const safeSlot = slot || 'slot1';

    const finalDir = path.join(basePath, safeConsoleId, safeGameId);
    fs.mkdirSync(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, `${safeSlot}.sav`);

    // On déplace/renomme le fichier temporaire vers sa destination finale
    fs.renameSync(file.path, finalPath);

    const relativePath = path.relative(basePath, finalPath);

    return {
      message: 'Save uploaded',
      gameId: safeGameId,
      consoleId: safeConsoleId,
      slot: safeSlot,
      filename: `${safeSlot}.sav`,
      path: finalPath,
      relativePath,
    };
  }


  @Get('list')
  list(@Query('gameId') gameId?: string) {
    const files = this.savesService.listSaves(gameId);
    return { files };
  }

  @Get('download')
  download(@Query('path') relativePath: string, @Res() res: any) {
    if (!relativePath) {
      res.status(400).json({ message: 'Missing "path" query parameter' });
      return;
    }

    // Petite protection basique contre le path traversal
    if (relativePath.includes('..')) {
      res.status(400).json({ message: 'Invalid path' });
      return;
    }

    try {
      const stream = this.savesService.getSaveStream(relativePath);
      const filename = path.basename(relativePath);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      stream.on('error', (err) => {
        console.error(err);
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        }
      });
      stream.pipe(res);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error while reading file' });
      }
    }
  }
}
