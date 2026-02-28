import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'veo-3.1-generate-preview';
const POLL_INTERVAL_MS = 10000;

function createClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY environment variable.');
  }

  return new GoogleGenAI({ apiKey });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function uploadImage(ai, imagePath) {
  const fileBuffer = fs.readFileSync(imagePath);
  const base64 = fileBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);

  return {
    imageBytes: base64,
    mimeType: mimeType
  };
}

export async function generateVideo({
    prompt,
    imagePath,
    model = DEFAULT_MODEL,
    pollIntervalMs = POLL_INTERVAL_MS
}) {
  const ai = createClient();

  const request = {
    model,
    prompt
  };

  // If image is provided, add it to the request
  if (imagePath) {
    const uploadedImage = await uploadImage(ai, imagePath);
    request.image = {
      imageBytes: uploadedImage.imageBytes,
      mimeType: uploadedImage.mimeType
    };
  }

  let operation = await ai.models.generateVideos(request);

  while (!operation.done) {
    await sleep(pollIntervalMs);
    operation = await ai.operations.getVideosOperation({
      operation
    });
  }

  return operation.response;
}

export async function downloadGeneratedVideo({
  operationResponse,
  downloadPath
}) {
  const ai = createClient();
  const videoFile = operationResponse.generatedVideos?.[0]?.video;
  if (!videoFile) {
    throw new Error('No generated video found in operation response.');
  }

  await ai.files.download({
    file: videoFile,
    downloadPath
  });
}
