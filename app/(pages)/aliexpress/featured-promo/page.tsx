"use client";

import {
  FiltersGroup,
  Search,
  SelectCategory,
  SelectPromos,
  SelectSortFeatured,
} from "@/components/filters";
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
import {
  generateAffiliateLink,
  getFeaturedProducts,
  getFeaturedPromos,
} from "@/lib/services";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { categories } from "@/lib/utils/categories";
import { DialogProduct } from "@/components/dialogProduct";
import { Pagination } from "@/components/ui/pagination";
import { PaginationProducts } from "@/components/paginationProducts";
import { LoadingProdutsSkeleton } from "@/components/loadings";
export default function Page() {
  const [products, setProducts] = useState([]);
  const searchParams = useSearchParams();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
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
    try {
      const { product } = await getFeaturedProducts({
        category_id: searchParams.get("category") || "",
        keywords: searchParams.get("search") || "",
        promotion_name: searchParams.get("promo") || "",
        page_no: parseInt(searchParams.get("page") || "1"),
        sort: searchParams.get("sort") || "",
      });

      if (product.length > 0) {
        setProducts(product);
      }
    } catch (error) {
      console.log(error);
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
      const promos = await getFeaturedPromos();
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
