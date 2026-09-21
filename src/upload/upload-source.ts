import {
  UploadError,
  uploadSource as uploadSourceFromHost,
  uploadSourcePath as uploadSourcePathFromHost,
  type UploadableFile,
  type UploadedSource,
} from "../host/v1-http.js";

export { UploadError, type UploadableFile, type UploadedSource };
export const UPLOAD_ENDPOINT = "/v1/upload";

export interface UploadSourceOptions {
  readonly fetch?: typeof globalThis.fetch;
}

export async function uploadSource(file: UploadableFile, options: UploadSourceOptions = {}) {
  return uploadSourceFromHost(file, options.fetch);
}

export async function uploadSourcePath(localPath: string, options: UploadSourceOptions = {}) {
  return uploadSourcePathFromHost(localPath, options.fetch);
}
