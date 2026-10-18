import { runTryOn } from "./engine";
import { Env, TryOnErrorResponse, TryOnSuccessResponse } from "./types";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB safety ceiling
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGIN);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "virtual-tryon-worker",
          space: env.HF_SPACE || "yisol/IDM-VTON",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Try-on endpoint
    if (request.method === "POST" && url.pathname === "/tryon") {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return jsonError(
            "Request must be multipart/form-data with person_image and garment_image",
            "INVALID_CONTENT_TYPE",
            400,
            corsHeaders
          );
        }

        const formData = await request.formData();
        const personFile = formData.get("person_image");
        const garmentFile = formData.get("garment_image");
        const garmentDescription = formData.get("garment_description");

        // Validate presence
        if (!isFileOrBlob(personFile)) {
          return jsonError(
            "Missing or invalid 'person_image' file in form data",
            "MISSING_PERSON_IMAGE",
            400,
            corsHeaders
          );
        }

        if (!isFileOrBlob(garmentFile)) {
          return jsonError(
            "Missing or invalid 'garment_image' file in form data",
            "MISSING_GARMENT_IMAGE",
            400,
            corsHeaders
          );
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.has(personFile.type.toLowerCase())) {
          return jsonError(
            `Unsupported person image format: ${personFile.type}. Allowed: JPEG, PNG, WebP.`,
            "UNSUPPORTED_PERSON_IMAGE_TYPE",
            415,
            corsHeaders
          );
        }

        if (!ALLOWED_MIME_TYPES.has(garmentFile.type.toLowerCase())) {
          return jsonError(
            `Unsupported garment image format: ${garmentFile.type}. Allowed: JPEG, PNG, WebP.`,
            "UNSUPPORTED_GARMENT_IMAGE_TYPE",
            415,
            corsHeaders
          );
        }

        // Validate payload size
        if (personFile.size > MAX_IMAGE_SIZE_BYTES) {
          return jsonError(
            `Person image exceeds maximum limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
            "PERSON_IMAGE_TOO_LARGE",
            413,
            corsHeaders
          );
        }

        if (garmentFile.size > MAX_IMAGE_SIZE_BYTES) {
          return jsonError(
            `Garment image exceeds maximum limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
            "GARMENT_IMAGE_TOO_LARGE",
            413,
            corsHeaders
          );
        }

        // Call the try-on engine
        const result = await runTryOn(personFile, garmentFile, env, {
          garmentDescription:
            typeof garmentDescription === "string" ? garmentDescription : undefined,
        });

        const responsePayload: TryOnSuccessResponse = {
          success: true,
          imageUrl: result.imageUrl,
          contentType: result.contentType,
          spaceUsed: result.spaceUsed,
        };

        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Internal Server Error";
        return jsonError(message, "TRYON_FAILED", 500, corsHeaders);
      }
    }

    return jsonError("Not Found", "NOT_FOUND", 404, corsHeaders);
  },
};

/**
 * Helper to compute CORS headers based on allowed origin configuration.
 */
function getCorsHeaders(requestOrigin: string, configuredOrigin?: string): Record<string, string> {
  const allowed = configuredOrigin || "http://localhost:5173";

  // If configured with wildcard or matches request origin, echo it back
  const isMatch =
    allowed === "*" ||
    allowed === requestOrigin ||
    (allowed.includes("localhost") && requestOrigin.includes("localhost"));

  const resolvedOrigin = isMatch ? requestOrigin || allowed : allowed;

  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Uniform JSON error response helper.
 */
function jsonError(
  message: string,
  code: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  const body: TryOnErrorResponse = {
    success: false,
    error: message,
    code,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Type guard for FormData files/blobs.
 */
function isFileOrBlob(value: unknown): value is File | Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}
