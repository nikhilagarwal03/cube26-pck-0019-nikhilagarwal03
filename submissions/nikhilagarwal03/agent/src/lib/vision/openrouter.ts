import type { VisionObservation } from "./index";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

export const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";

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

export type VisionPackRequest = {
  imageUrl: string;
  expectedSkus: string[];
  catalogueContext?: string;
  signal?: AbortSignal;
};

export type VisionResult = {
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

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getContent(response: GroqResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no vision content");
  }
  return content;
}

export async function analyzePackImage(
  request: VisionPackRequest,
): Promise<VisionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = request.signal
    ? AbortSignal.any([request.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
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
      throw new Error(`Groq request failed (${response.status}): ${details}`);
    }

    const payload = (await response.json()) as GroqResponse;
    return JSON.parse(getContent(payload)) as VisionResult;
  } finally {
    clearTimeout(timeout);
  }
}