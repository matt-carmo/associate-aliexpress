"use client";

import { FiltersGroup, Search, SelectCategory, SelectSortFeatured } from "@/components/filters";
import { Product } from "@/components/product";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFilterContext } from "@/hooks/filters";
import { generateAffiliateLink, getHotProducts } from "@/lib/services";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { sendPhoto } from "@/app/services/sendPhoto";
import { categories } from "@/lib/utils/categories";
import { DialogProduct } from "@/components/dialogProduct";
import { PaginationProducts } from "@/components/paginationProducts";
export default function Page() {
  const [products, setProducts] = useState([]);

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
    try {
      const { product } = await getHotProducts({
        category_ids: searchParams.get("category") || "",
        keywords: searchParams.get("search") || "",
        page_no: parseInt(searchParams.get("page") || "1"),
        sort: searchParams.get("sort") || "",
      });

      setProducts(product);
    } catch (error) {
      console.log(error);
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
