
import { AppFolder } from '../types';

/**
 * PathManager
 * 
 * Exposes canonical getters for each folder and abstracts platform differences.
 * In a web context, these paths map to virtual handles in the Origin Private File System (OPFS).
 */
export class PathManager {
  private static readonly ROOT = ''; // Root of OPFS

  static getPath(folder: AppFolder): string {
    return `${this.ROOT}${folder}`;
  }

  static getConfigPath(): string {
    return this.getPath(AppFolder.Config);
  }

  static getUserPath(): string {
    return this.getPath(AppFolder.User);
  }

  static getChatPath(): string {
    return this.getPath(AppFolder.Chat);
  }

  static getMediaPath(): string {
    return this.getPath(AppFolder.Media);
  }

  static getReportsPath(): string {
    return this.getPath(AppFolder.Reports);
  }

  static getLogsPath(): string {
    return this.getPath(AppFolder.Logs);
  }

  static getSecurityPath(): string {
    return this.getPath(AppFolder.Security);
  }

  static getSyncPath(): string {
    return this.getPath(AppFolder.Sync);
  }

  static getBackupsPath(): string {
    return this.getPath(AppFolder.Backups);
  }

  static getManifestFilename(): string {
    return 'app_manifest.json';
  }

  /**
   * Returns the platform specific base path or identifier.
   * For Web, this is implicit in the StorageManager API.
   */
  static getPlatformRoot(): string {
    return 'opfs://root';
  }
}
