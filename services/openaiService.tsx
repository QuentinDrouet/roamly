import OpenAI from "openai";

class OpenAIService {
  private static instance: OpenAIService | null = null;
  private client: OpenAI | null = null;

  private constructor() {}

  public static getInstance(): OpenAIService {
    if (!this.instance) {
      this.instance = new OpenAIService();
    }
    return this.instance;
  }

  public async searchWeb(query: string): Promise<any> {
    try {
      const response = await fetch('/api/openai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  public async callOpenAI(query: string, apiKey: string): Promise<any> {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: apiKey
      });
    }
  
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: "Tu es un assistant qui analyse des informations et répond en format JSON et en français. Analyse l'information suivante: " + query
          }
        ],
        temperature: 0.4
      });
  
      return response.choices[0].message;
    } catch (error) {
      console.error("OpenAI error:", error);
      throw error;
    }
  }

}

export default OpenAIService;