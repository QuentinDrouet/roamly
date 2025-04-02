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

  public async searchWeb(queries: string[]): Promise<any> {
    try {
      const response = await fetch('/api/openai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: queries }),
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

  public async callOpenAI(addresses: string[], apiKey: string): Promise<any> {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: apiKey
      });
    }
  
    try {
      // Prepare the query to include all addresses
      const addressListText = addresses.map(addr => `- ${addr}`).join('\n');
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an assistant specialized in analyzing tourist or historical places.
            You will receive a list of addresses or places. For EACH place in the list, you must produce an analysis.
            You must always respond in English and in a specific JSON format like this:
            {
              "results": [
                {
                  "address": "The original address of the analyzed place",
                  "introduction": "A detailed introduction of the place, its history, why it's known and what happened there",
                  "creationDate": "The creation date of the place (leave empty if unknown)",
                  "placesToVisit": [
                    {
                      "name": "Name of the first place to visit",
                      "address": "Precise address or location",
                      "context": "Description of what can be done, seen or experienced there",
                      "paid": "Yes/No/Price (leave empty if unknown)"
                    },
                    {
                      "name": "Name of the second place",
                      "address": "Precise address or location",
                      "context": "Description of what can be done, seen or experienced there",
                      "paid": "Yes/No/Price (leave empty if unknown)"
                    }
                  ]
                },
                {
                  "address": "The original address of the second analyzed place",
                  "introduction": "...",
                  "creationDate": "...",
                  "placesToVisit": [...]
                }
                ... and so on for each address/place in the list
              ]
            }`
          },
          {
            role: "user",
            content: `Here is the list of addresses to analyze:\n${addressListText}`
          }
        ],
        temperature: 0.4
      });
  
      if (response.choices[0].message.content) {
        try {
          return JSON.parse(response.choices[0].message.content);
        } catch (e) {
          console.error("Error parsing JSON:", e);
          return response.choices[0].message.content;
        }
      }
      
      return response.choices[0].message;
    } catch (error) {
      console.error("OpenAI error:", error);
      throw error;
    }
  }
}

export default OpenAIService;