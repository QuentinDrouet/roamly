import OpenAIService from "../../services/openaiService";
import OpenAI from "openai";


// test github action



// Mocking the OpenAI library test mock
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
  });
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("OpenAIService", () => {
  let openAIService: OpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    openAIService = OpenAIService.getInstance();
  });

  test("getInstance devrait retourner une instance singleton", () => {
    const instance1 = OpenAIService.getInstance();
    const instance2 = OpenAIService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test("searchWeb devrait appeler fetch avec les bons paramètres", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ result: "success" })
    };
    mockFetch.mockReturnValueOnce(Promise.resolve(mockResponse));

    const query = "Paris 6ème arrondissement";
    const result = await openAIService.searchWeb([query]);

    expect(mockFetch).toHaveBeenCalledWith("/api/openai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addresses: [query] }),
    });

    expect(result).toEqual({ result: "success" });
  });
});
