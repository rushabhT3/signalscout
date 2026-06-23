import { GoogleGenAI, Type, type Schema } from "@google/genai";
import {
  outreachDraftSchema,
  signalEvaluationSchema,
  SIGNAL_CATEGORIES,
  type OutreachDraft,
  type SignalEvaluation,
} from "@signalscout/shared";
import type { AiConfig } from "../config/app-config.service";
import type { AiEvaluator, DraftOutreachInput, EvaluateSignalInput } from "./ai-evaluator";
import {
  buildEvaluationPrompt,
  buildOutreachPrompt,
  OUTREACH_SYSTEM_INSTRUCTION,
  SIGNAL_SYSTEM_INSTRUCTION,
} from "./prompts";

const SIGNAL_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    isMatch: { type: Type.BOOLEAN },
    confidence: { type: Type.INTEGER },
    category: { type: Type.STRING, enum: [...SIGNAL_CATEGORIES] },
    reasoning: { type: Type.STRING },
    likelyNeed: { type: Type.STRING },
    suggestedAngle: { type: Type.STRING },
  },
  required: ["isMatch", "confidence", "category", "reasoning", "likelyNeed", "suggestedAngle"],
  propertyOrdering: ["isMatch", "confidence", "category", "reasoning", "likelyNeed", "suggestedAngle"],
};

const OUTREACH_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
    followUp: { type: Type.STRING },
  },
  required: ["subject", "body", "followUp"],
  propertyOrdering: ["subject", "body", "followUp"],
};

export class GeminiEvaluator implements AiEvaluator {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: AiConfig) {
    if (!config.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is required for the Gemini evaluator.");
    }
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.model = config.geminiModel;
  }

  async evaluateSignal(input: EvaluateSignalInput): Promise<SignalEvaluation> {
    const json = await this.generateJson(
      SIGNAL_SYSTEM_INSTRUCTION,
      buildEvaluationPrompt(input),
      SIGNAL_RESPONSE_SCHEMA,
      0.2,
    );
    return signalEvaluationSchema.parse(json);
  }

  async draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft> {
    const json = await this.generateJson(
      OUTREACH_SYSTEM_INSTRUCTION,
      buildOutreachPrompt(input),
      OUTREACH_RESPONSE_SCHEMA,
      0.7,
    );
    return outreachDraftSchema.parse(json);
  }

  private async generateJson(
    systemInstruction: string,
    prompt: string,
    responseSchema: Schema,
    temperature: number,
  ): Promise<unknown> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return JSON.parse(text);
  }
}
