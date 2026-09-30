import {
  generateImage as generateImageFromHost,
  generatedImageLocatorSrc,
  generatedImageSrc,
  type GeneratedImage,
} from "../host/v1-http.js";

export { generatedImageLocatorSrc, generatedImageSrc, type GeneratedImage };

export async function generateImage(prompt: string, fetchImpl?: typeof fetch): Promise<GeneratedImage> {
  return generateImageFromHost(prompt, fetchImpl);
}
