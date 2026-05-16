"use client";

import { FiltersGroup, Search, SelectCategory, SelectSortFeatured } from "@/components/filters";
import { Product } from "@/components/product";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DialogProduct } from "@/components/dialogProduct";
import { PaginationProducts } from "@/components/paginationProducts";
export default function Page() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const sortOptions = [
    "SALE_PRICE_ASC",
    "SALE_PRICE_DESC",
    "LAST_VOLUME_ASC",
    "LAST_VOLUME_DESC",
  ];
  const _getProducts = async (keyword?: string) => {
    setLoading(true);
    setProducts([]);
    setError("");
    try {
      const response = await fetch(
        `/api/aliexpress?type=hot-products&category_ids=${encodeURIComponent(searchParams.get("category") || "")}&keywords=${encodeURIComponent(searchParams.get("search") || "")}&page_no=${encodeURIComponent(searchParams.get("page") || "1")}&sort=${encodeURIComponent(searchParams.get("sort") || "")}`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch products");
      }

      const { product } = await response.json();

      setProducts(product);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    _getProducts();
  }, [searchParams]);
  return (
    <div className="p-4">
      <FiltersGroup>
        <Search />
        <SelectCategory />
        <SelectSortFeatured options={sortOptions} />
      </FiltersGroup>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="grid grid-cols-5 gap-3 mt-3">
        {loading && <p>Carregando...</p>}
        {(!loading && products.length === 0) && (
          <p>Não há produtos para exibir</p>
        )}
        {products.map((product: Product) => (
          <DialogProduct key={product.product_id} product={product} />
        ))}
      </ul>
      {!loading && products.length > 0 && (
        <PaginationProducts />
      )}
    </div>
  );
}
