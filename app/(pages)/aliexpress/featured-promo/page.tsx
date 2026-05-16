"use client";

import {
  FiltersGroup,
  Search,
  SelectCategory,
  SelectPromos,
  SelectSortFeatured,
} from "@/components/filters";
import { Product } from "@/components/product";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DialogProduct } from "@/components/dialogProduct";
import { Pagination } from "@/components/ui/pagination";
import { PaginationProducts } from "@/components/paginationProducts";
import { LoadingProdutsSkeleton } from "@/components/loadings";
export default function Page() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const sortOptions = [
    "commissionAsc",
    "commissionDesc",
    "priceAsc",
    "priceDesc",
    "volumeAsc",
    "volumeDesc",
    "discountAsc",
    "discountDesc",
    "ratingAsc",
    "ratingDesc",
    "promotionTimeAsc",
    "promotionTimeDesc",
  ];
  const _getProducts = async (keyword?: string) => {
    setLoading(true);
    setProducts([]);
    setError("");
    try {
      const response = await fetch(
        `/api/aliexpress?type=featured-products&category_id=${encodeURIComponent(searchParams.get("category") || "")}&keywords=${encodeURIComponent(searchParams.get("search") || "")}&promotion_name=${encodeURIComponent(searchParams.get("promo") || "")}&page_no=${encodeURIComponent(searchParams.get("page") || "1")}&sort=${encodeURIComponent(searchParams.get("sort") || "")}`
      );
      console.log(response);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch products");
      }

      const { product } = await response.json();

      if (product.length > 0) {
        setProducts(product);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch products");
    }
    finally {
      setLoading(false);
    }
  };
  const _getFeaturedPromos = async () => {
    try {
      if(sessionStorage.getItem('promos')) {
        return setPromos(JSON.parse(sessionStorage.getItem('promos') || ''));  
      }
      const response = await fetch(`/api/aliexpress?type=featured-promos`);

      if (!response.ok) {
        throw new Error("Failed to fetch promos");
      }

      const promos = await response.json();
      sessionStorage.setItem("promos", JSON.stringify(promos));
      setPromos(promos);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    _getFeaturedPromos();
    _getProducts();
  }, [searchParams]);
  return (
    <div className="p-4">
      <FiltersGroup>
        <Search />
        <SelectCategory />
        <SelectPromos arr={promos} />
        <SelectSortFeatured options={sortOptions} />
      </FiltersGroup>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="grid grid-cols-4 gap-3 mt-3">
        {loading && <LoadingProdutsSkeleton />}
        {(!loading && products.length === 0) && <p>Não há produtos para exibir</p>}
        {products.map((product: Product) => (
          <DialogProduct key={product.product_id} product={product} />
        ))}
        {/* <Product product={objMockup}  /> */}
      </ul>
      {!loading && products.length > 0 && (
        <PaginationProducts />
      )}
    </div>
  );
}
