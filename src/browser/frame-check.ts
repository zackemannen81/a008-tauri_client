import { checkFrame as checkFrameFromHost, type FrameCheck } from "../host/v1-http.js";

export type { FrameCheck };

export async function checkFrame(url: string, fetchImpl?: typeof fetch): Promise<FrameCheck> {
  return checkFrameFromHost(url, fetchImpl);
}
