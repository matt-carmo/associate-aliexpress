"use client";
import React, { useEffect, useState } from "react";
import CuratedCard from "./CuratedCard";

export const CuratedPage = ({ apiUrl, title, subtitle, transform }: { apiUrl: string; title: string; subtitle?: string; transform?: (items: any[]) => any[] }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagesInput, setPagesInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState(apiUrl);

  const load = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : payload.product || payload.products || [];
      const processed = transform ? transform(list) : list;
      setItems(processed);
    } catch (err: any) {
      setError(err.message || "Fetch error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUrl(apiUrl);
    load(apiUrl);
  }, [apiUrl, transform]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input
          value={pagesInput}
          onChange={(e) => setPagesInput(e.target.value)}
          placeholder="pages (e.g. 1-5 or 1,2,3)"
          className="border px-2 py-1 text-sm rounded"
        />
        <button
          onClick={() => {
            const url = pagesInput ? `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}pages=${encodeURIComponent(pagesInput)}` : apiUrl;
            setCurrentUrl(url);
            load(url);
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Fetch
        </button>
        <button
          onClick={() => {
            setPagesInput("");
            setCurrentUrl(apiUrl);
            load(apiUrl);
          }}
          className="bg-gray-200 text-sm px-3 py-1 rounded"
        >
          Reset
        </button>
        <div className="ml-auto text-xs text-gray-500">Source: {currentUrl}</div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="grid grid-cols-3 gap-4">
        {!loading && items.map((p, idx) => (
          <CuratedCard key={p.productId ?? p.product_id ?? idx} product={p} />
        ))}
      </ul>
    </div>
  );
};

export default CuratedPage;
