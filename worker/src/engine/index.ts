import { Client } from "@gradio/client";
import { Env, TryOnOptions, TryOnResult } from "../types";

/**
 * Pluggable Try-On Engine Adapter.
 *
 * Encapsulates the virtual try-on engine behind a single function.
 * Default target: yisol/IDM-VTON on Hugging Face Spaces.
 * Easily swappable for CatVTON, Kolors, or custom hosted endpoints.
 */
export async function runTryOn(
  personBlob: Blob,
  garmentBlob: Blob,
  env: Env,
  options: TryOnOptions = {}
): Promise<TryOnResult> {
  const spaceId = env.HF_SPACE || "yisol/IDM-VTON";
  const hfToken = env.HF_TOKEN?.trim() || undefined;

  const garmentDescription = options.garmentDescription || "garment clothing item";
  const denoiseSteps = options.denoiseSteps ?? 30;
  const seed = options.seed ?? 42;

  try {
    // Connect to the Hugging Face Space using @gradio/client
    const clientOptions: Record<string, unknown> = {};
    if (hfToken) {
      clientOptions.hf_token = hfToken;
    }

    const app = await Client.connect(spaceId, clientOptions);

    /**
     * IDM-VTON /tryon API contract:
     * - dict: { background: Blob, layers: [], composite: null }
     * - garm_img: Blob
     * - garment_des: string
     * - is_checked: boolean (auto-masking)
     * - is_checked_crop: boolean (auto-crop)
     * - denoise_steps: number (10-40)
     * - seed: number
     */
    const result = await app.predict("/tryon", [
      {
        background: personBlob,
        layers: [],
        composite: null,
      },
      garmentBlob,
      garmentDescription,
      true, // is_checked
      false, // is_checked_crop
      denoiseSteps,
      seed,
    ]);

    const outputData = result.data as unknown[];
    if (!outputData || outputData.length === 0) {
      throw new Error("No output received from the try-on model");
    }

    // Gradio 4/5 file payload resolution
    const firstOutput = outputData[0];
    let resolvedUrl = "";

    if (typeof firstOutput === "string") {
      resolvedUrl = firstOutput;
    } else if (firstOutput && typeof firstOutput === "object") {
      const fileObj = firstOutput as Record<string, unknown>;
      if (typeof fileObj.url === "string") {
        resolvedUrl = fileObj.url;
      } else if (typeof fileObj.path === "string") {
        resolvedUrl = fileObj.path;
      }
    }

    if (!resolvedUrl) {
      throw new Error("Unable to parse image URL from try-on output");
    }

    // Fetch the resulting image from Hugging Face through the Worker and convert to a base64 Data URL
    // This ensures no user photo or generated asset is persisted, and bypasses third-party CORS/auth issues in the browser.
    const fetchHeaders: HeadersInit = {};
    if (hfToken) {
      fetchHeaders["Authorization"] = `Bearer ${hfToken}`;
    }

    const imageResponse = await fetch(resolvedUrl, { headers: fetchHeaders });
    if (!imageResponse.ok) {
      throw new Error(`Failed to download output image from Space: ${imageResponse.statusText}`);
    }

    const contentType = imageResponse.headers.get("content-type") || "image/png";
    const arrayBuffer = await imageResponse.arrayBuffer();

    // Convert to base64 Data URL using web-standard Buffer/Uint8Array
    const base64String = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${contentType};base64,${base64String}`;

    return {
      imageUrl: dataUrl,
      contentType,
      spaceUsed: spaceId,
    };
  } catch (error) {
    console.error("[runTryOn Raw Error]:", error);
    let message = "Try-on inference failed";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === "string") {
        message = errObj.message.replace(/^['"]|['"]$/g, "");
      } else {
        message = JSON.stringify(error);
      }
    } else {
      message = String(error);
    }

    if (message.includes("ZeroGPU quota")) {
      message = `${message} — Add your free Hugging Face token (HF_TOKEN) to worker/.dev.vars for more GPU quota.`;
    }

    throw new Error(`Try-on engine error (${spaceId}): ${message}`);
  }
}

/**
 * Efficient ArrayBuffer to base64 converter in Cloudflare Workers environment.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}
