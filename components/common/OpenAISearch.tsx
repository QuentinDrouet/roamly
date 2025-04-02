"use client";

import { useState } from "react";
import OpenAIService from "@/services/openaiService";

export default function OpenAISearch() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Veuillez entrer une requête");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const openAIService = OpenAIService.getInstance();
      const data = await openAIService.searchWeb(query);
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Une erreur est survenue lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Recherche OpenAI</h1>
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Entrez votre requête..."
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Recherche en cours..." : "Rechercher"}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Résultat :</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}