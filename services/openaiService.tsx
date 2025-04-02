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
            role: "system",
            content: `Tu es un assistant spécialisé dans l'analyse de lieux touristiques ou historiques. 
            Tu dois toujours répondre en français et dans un format JSON spécifique avec les champs suivants:
            {
              "introduction": "Une introduction détaillée du lieu, son histoire, pourquoi il est connu et ce qui s'y est passé",
              "dateCreation": "La date de création du lieu (laisser vide si inconnue)",
              "lieuxAVisiter": [
                {
                  "nom": "Nom du premier lieu à visiter",
                  "adresse": "Adresse ou localisation précise",
                  "contexte": "Description de ce qu'on peut y faire, voir ou expérimenter",
                  "payant": "Oui/Non/Prix (laisser vide si inconnu)"
                },
                {
                  "nom": "Nom du deuxième lieu",
                  "adresse": "Adresse ou localisation précise",
                  "contexte": "Description de ce qu'on peut y faire, voir ou expérimenter",
                  "payant": "Oui/Non/Prix (laisser vide si inconnu)"
                }
                ... et ainsi de suite pour tous les lieux pertinents
              ]
            }`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.4
      });
  

      if (response.choices[0].message.content) {
        try {
          return JSON.parse(response.choices[0].message.content);
        } catch (e) {
          console.error("Erreur lors du parsing JSON:", e);
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