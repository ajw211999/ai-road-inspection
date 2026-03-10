import { promises as fs } from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are an expert road pavement inspector. Analyze this road surface image and provide a detailed assessment.

Respond ONLY with valid JSON in this exact format:
{
  "distressType": "<one of: alligator_cracking, longitudinal_cracking, transverse_cracking, pothole, rutting, bleeding, raveling, patch_deterioration, depression, edge_cracking, none>",
  "severity": "<one of: low, medium, high>",
  "confidence": <number 0.0-1.0>,
  "pciScore": <integer 0-100, where 100 is perfect condition>,
  "surfaceType": "<one of: asphalt, concrete, gravel, unpaved>",
  "adaCurbRampFlag": <boolean, true if a damaged or missing ADA curb ramp is visible>,
  "notes": "<brief description of observed conditions>"
}

PCI scoring guide:
- 100-86: Good — no visible distress
- 85-71: Satisfactory — minor surface wear
- 70-56: Fair — moderate cracking or patching
- 55-41: Poor — significant distress, multiple types
- 40-0: Failed — severe deterioration, safety hazard

If the image does not show a road surface (e.g. sky, interior, blurry), set distressType to "none", pciScore to 0, confidence to 0, and note this in the notes field.`;

export interface FrameAnalysis {
  distressType: string;
  severity: string;
  confidence: number;
  pciScore: number;
  surfaceType: string;
  adaCurbRampFlag: boolean;
  notes: string;
}

interface AnalysisResult {
  analysis: FrameAnalysis;
  rawResponse: Record<string, unknown>;
  provider: "openai" | "anthropic";
}

async function imageToBase64(imagePath: string): Promise<string> {
  const absolutePath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);
  const buffer = await fs.readFile(absolutePath);
  return buffer.toString("base64");
}

async function analyzeWithOpenAI(base64Image: string): Promise<AnalysisResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Analyze this road surface image for pavement condition.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  const analysis = JSON.parse(jsonMatch[0]) as FrameAnalysis;
  return {
    analysis,
    rawResponse: data,
    provider: "openai",
  };
}

async function analyzeWithAnthropic(
  base64Image: string
): Promise<AnalysisResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Analyze this road surface image for pavement condition.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from Anthropic response");
  }

  const analysis = JSON.parse(jsonMatch[0]) as FrameAnalysis;
  return {
    analysis,
    rawResponse: data,
    provider: "anthropic",
  };
}

const VALID_DISTRESS_TYPES = [
  "alligator_cracking",
  "longitudinal_cracking",
  "transverse_cracking",
  "pothole",
  "rutting",
  "bleeding",
  "raveling",
  "patch_deterioration",
  "depression",
  "edge_cracking",
  "none",
];

const VALID_SEVERITIES = ["low", "medium", "high"];
const VALID_SURFACE_TYPES = ["asphalt", "concrete", "gravel", "unpaved"];

function validateAnalysis(analysis: FrameAnalysis): FrameAnalysis {
  return {
    distressType: VALID_DISTRESS_TYPES.includes(analysis.distressType)
      ? analysis.distressType
      : "none",
    severity: VALID_SEVERITIES.includes(analysis.severity)
      ? analysis.severity
      : "low",
    confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0)),
    pciScore: Math.max(0, Math.min(100, Math.round(Number(analysis.pciScore) || 0))),
    surfaceType: VALID_SURFACE_TYPES.includes(analysis.surfaceType)
      ? analysis.surfaceType
      : "asphalt",
    adaCurbRampFlag: Boolean(analysis.adaCurbRampFlag),
    notes: String(analysis.notes || ""),
  };
}

export async function analyzeFrame(
  imagePath: string
): Promise<AnalysisResult> {
  const base64Image = await imageToBase64(imagePath);

  // Try OpenAI first, fall back to Anthropic
  if (OPENAI_API_KEY) {
    try {
      const result = await analyzeWithOpenAI(base64Image);
      result.analysis = validateAnalysis(result.analysis);
      return result;
    } catch (err) {
      console.error("OpenAI analysis failed, trying Anthropic fallback:", err);
    }
  }

  if (ANTHROPIC_API_KEY) {
    const result = await analyzeWithAnthropic(base64Image);
    result.analysis = validateAnalysis(result.analysis);
    return result;
  }

  throw new Error(
    "No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
  );
}
