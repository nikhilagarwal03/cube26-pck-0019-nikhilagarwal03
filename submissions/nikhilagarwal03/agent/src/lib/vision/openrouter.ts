import type { VisionObservation } from "./index";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

// Set OPENROUTER_MODEL to the vision model selected for the deployment.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "<MODEL_PLACEHOLDER>";

export const PACK_VISION_SYSTEM_PROMPT = `You are a cautious outbound packing verifier.

Inspect the supplied open-box image and return only a valid JSON object. Read visible
product text, SKU labels, barcodes, and packaging marks when they are legible. Count
every physically visible item, including identical items, without counting printed
images, product illustrations, labels, or reflections as physical products.

Assess occlusion before making a judgment. If an item is partly hidden, cropped,
blurred, too small, or otherwise not reliably countable, report it as uncertain and
explain the limitation. Never invent a SKU, quantity, or item that is not visible.

Expected SKUs and catalogue metadata are candidate references only. Do not make a
product match solely because a candidate SKU was supplied. If a visible item has a
different or unreadable SKU, report it as a decoy or unexpected item rather than
forcing it to match the closest expected SKU. Keep decoys separate from confirmed
observations. A decoy may be visible even when the expected item is also present.

Use this exact JSON shape:
{
  "observations": [{
    "sku": "string or UNKNOWN",
    "quantity": 0,
    "confidence": 0,
    "evidenceRef": "short description of visible evidence"
  }],
  "decoys": [{
    "label": "string",
    "quantity": 0,
    "reason": "why it does not match an expected item"
  }],
  "occlusion": {
    "status": "clear | partial | severe",
    "details": "string"
  },
  "status": "complete | uncertain",
  "reason": "string"
}

Use status=uncertain whenever the image cannot support a reliable inventory. The
response describes visual evidence only; do not produce a SEAL or STOP_AND_FIX
decision here.`;

export type OpenRouterPackRequest = {
  imageUrl: string;
  expectedSkus: string[];
  catalogueContext?: string;
  signal?: AbortSignal;
};

export type OpenRouterVisionResult = {
  observations: VisionObservation[];
  decoys: Array<{
    label: string;
    quantity: number;
    reason: string;
  }>;
  occlusion: {
    status: "clear" | "partial" | "severe";
    details: string;
  };
  status: "complete" | "uncertain";
  reason: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getContent(response: OpenRouterResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no vision content");
  }
  return content;
}

export async function analyzePackImage(
  request: OpenRouterPackRequest,
): Promise<OpenRouterVisionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = request.signal
    ? AbortSignal.any([request.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_HTTP_REFERER
          ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
          : {}),
        ...(process.env.OPENROUTER_APP_NAME
          ? { "X-Title": process.env.OPENROUTER_APP_NAME }
          : {}),
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: PACK_VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  expectedSkus: request.expectedSkus,
                  catalogueContext: request.catalogueContext ?? null,
                }),
              },
              { type: "image_url", image_url: { url: request.imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${details}`);
    }

    const payload = (await response.json()) as OpenRouterResponse;
    return JSON.parse(getContent(payload)) as OpenRouterVisionResult;
  } finally {
    clearTimeout(timeout);
  }
}