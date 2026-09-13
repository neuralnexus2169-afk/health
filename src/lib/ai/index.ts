import { AIProvider } from './ai-provider';
import { GeminiAIProvider } from './gemini-provider';
import { MockAIProvider } from './mock-provider';

let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    // If running server-side with GEMINI_API_KEY available
    const hasGeminiKey =
      typeof process !== 'undefined' &&
      process.env &&
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 0;

    if (hasGeminiKey) {
      aiProviderInstance = new GeminiAIProvider();
    } else {
      // Graceful fallback to deterministic Mock provider
      aiProviderInstance = new MockAIProvider();
    }
  }
  return aiProviderInstance;
}

export * from './ai-provider';
export * from './gemini-provider';
export * from './mock-provider';
export * from './prompts/medical-extraction';
