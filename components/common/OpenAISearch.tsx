"use client";

import { useState } from "react";

export default function OpenAISearch() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [error, setError] = useState("");

  const addAddress = () => {
    if (currentAddress.trim()) {
      setAddresses([...addresses, currentAddress.trim()]);
      setCurrentAddress("");
    }
  };

  const removeAddress = (index: number) => {
    const newAddresses = [...addresses];
    newAddresses.splice(index, 1);
    setAddresses(newAddresses);
  };

  const handleSearch = async () => {
    if (addresses.length === 0) {
      setError("Veuillez ajouter au moins une adresse");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/openai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Une erreur est survenue lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAddress();
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Recherche OpenAI</h1>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentAddress}
            onChange={(e) => setCurrentAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
            placeholder="Entrez une adresse..."
          />
          <button
            onClick={addAddress}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>

        {addresses.length > 0 && (
          <div className="mt-2">
            <h3 className="text-md font-semibold mb-2">Adresses à analyser :</h3>
            <ul className="bg-gray-50 p-2 rounded">
              {addresses.map((address, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{address}</span>
                  <button
                    onClick={() => removeAddress(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSearch}
          disabled={loading || addresses.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-2"
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
