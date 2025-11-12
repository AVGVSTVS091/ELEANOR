
import { AppFolder, AppManifest } from '../types';
import { PathManager } from './PathManager';

/**
 * FileSystemService
 * 
 * Manages the creation and maintenance of the app's file structure using
 * the Origin Private File System (OPFS) API for web.
 */
export const FileSystemService = {
  /**
   * Initializes the file system on app launch.
   * Creates required folders if they don't exist and writes the manifest.
   */
  async initialize() {
    if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
      console.warn('FileSystemService: OPFS not supported. File structure will be virtual/localstorage based.');
      return;
    }

    try {
      const root = await navigator.storage.getDirectory();
      
      // 1. Create Directory Structure
      console.log('FileSystemService: Verifying folder structure...');
      for (const folder of Object.values(AppFolder)) {
        await root.getDirectoryHandle(folder, { create: true });
      }

      // 2. Check/Write Manifest
      let manifestHandle;
      try {
        manifestHandle = await root.getFileHandle(PathManager.getManifestFilename());
      } catch (e) {
        // Manifest doesn't exist, create it
        console.log('FileSystemService: First run detected. Creating manifest.');
        manifestHandle = await root.getFileHandle(PathManager.getManifestFilename(), { create: true });
        await this.writeManifest(manifestHandle);
      }

      console.log('FileSystemService: Initialization complete.');
    } catch (error) {
      console.error('FileSystemService: Initialization failed', error);
    }
  },

  async writeManifest(fileHandle: FileSystemFileHandle) {
    const manifest: AppManifest = {
      version: '1.0.0',
      installDate: new Date().toISOString(),
      lastIntegrityCheck: new Date().toISOString(),
      folders: Object.values(AppFolder).reduce((acc, folder) => {
        acc[folder] = PathManager.getPath(folder);
        return acc;
      }, {} as Record<string, string>),
      checksums: {} // In a real scenario, calculate hashes of critical config files
    };

    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(manifest, null, 2));
    await writable.close();
  },

  /**
   * Writes a file to a specific folder securely.
   */
  async writeFile(folder: AppFolder, filename: string, content: Blob | string) {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle(folder);
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error(`FileSystemService: Failed to write ${filename} to ${folder}`, error);
      throw error;
    }
  }
};
