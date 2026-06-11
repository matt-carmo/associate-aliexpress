import sharp from "sharp";
import { Readable } from "stream";

export interface ImageProcessor {
  makeImageThumbnail(
    input: Buffer | string | Readable,
    options?: { width?: number; quality?: number }
  ): Promise<{ jpeg: Buffer; original: { width?: number; height?: number } }>;
  makeProfilePicture(
    input: Buffer | string | Readable,
    options?: { width?: number; height?: number; quality?: number }
  ): Promise<{ jpeg: Buffer }>;
}

async function toBuffer(input: Buffer | string | Readable): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === "string") return input as unknown as Buffer;
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export const imageProcessor: ImageProcessor = {
  async makeImageThumbnail(input, options = {}) {
    const buffer = await toBuffer(input);
    const img = sharp(buffer);
    const metadata = await img.metadata();
    const jpeg = await img
      .resize(options.width ?? 32)
      .jpeg({ quality: options.quality ?? 50 })
      .toBuffer();
    return {
      jpeg,
      original: {
        width: metadata.width,
        height: metadata.height,
      },
    };
  },

  async makeProfilePicture(input, options = {}) {
    const buffer = await toBuffer(input);
    const { width = 640, height = 640 } = options;
    const jpeg = await sharp(buffer)
      .resize(width, height)
      .jpeg({ quality: options.quality ?? 50 })
      .toBuffer();
    return { jpeg };
  },
};
