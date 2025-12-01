import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SavesService {
  private basePath = process.env.SAVES_BASE_PATH || '/mnt/3ds-saves';

    listSaves(gameId?: string): string[] {
    const root = this.basePath;
    const results: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const rel = path.relative(root, fullPath);
          const parts = rel.split(path.sep);

          const consoleId = parts[0];
          const relGameId = parts[1];

          const gameMatches = !gameId || relGameId === gameId;

          if (gameMatches) {
            results.push(rel);
          }
        }
      }
    };

    if (fs.existsSync(root)) {
      walk(root);
    }

    return results;
  }


  getSaveStream(relativePath: string): fs.ReadStream {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.createReadStream(fullPath);
  }

  getSaveFullPath(relativePath: string): string {
    return path.join(this.basePath, relativePath);
  }
}
