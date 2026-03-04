import { promises as fs } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const storage = {
  async save(key: string, data: Buffer): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  },

  getUrl(key: string): string {
    return `/api/files/${key}`;
  },

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(UPLOADS_DIR, key));
      return true;
    } catch {
      return false;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, key));
    } catch {
      // ignore if file doesn't exist
    }
  },

  /** Resolve an absolute path within the uploads directory */
  resolve(key: string): string {
    return path.join(UPLOADS_DIR, key);
  },
};
