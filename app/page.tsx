"use client";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Product } from "../components/product";
import { use, useCallback, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

import { generateAffiliateLink, getHotProducts } from "@/lib/services";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/utils/categories";
import { Input } from "@/components/ui/input";
import { useFilterContext } from "@/hooks/filters";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [products, setProducts] = useState([]);

  const [textArea, setTextArea] = useState("");
  const [loadingTextArea, setLoadingTextArea] = useState(true);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const searchParams = useSearchParams();
 
  const _getProducts = async (keyword?: string) => {
    setProducts([]);
    try {
      const { product } = await getHotProducts({
        category_ids: value.toString(),
        keywords: keyword,
        page_no: parseInt(searchParams.get("page") || "1"),
        sort: searchParams.get("sort") || "",
      });
      setProducts(product);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    _getProducts();
  }, [searchParams]);

  return (
    <div className="p-4">
      <h1>Home</h1>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {value
              ? categories.find(
                  (category) => category.category_id.toString() === value
                )?.category_name
              : "Select framework..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search framework..." className="h-9" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.category_id}
                    value={category.category_name}
                    onSelect={(currentValue) => {
                      setValue(
                        currentValue === category.category_name
                          ? category.category_id.toString()
                          : category.category_id.toString()
                      );

                      setOpen(false);
                    }}
                  >
                    {category.category_name}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === category.category_id.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex gap-2 mt-2">
        <Input
          type="text"
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          placeholder="Pesquisar"
        />
        <Button onClick={() => _getProducts(keyword)}>Pesquisar</Button>
      </div>
      <ul className="grid grid-cols-4 gap-3 mt-3">
        {products.map((product: Product) => (
          <li>
            <Dialog>
              <DialogTrigger
                onClick={async () => {
                  setLoadingTextArea(true);
                  try {
                    const afiliateLink = await generateAffiliateLink({
                      product_detail_url: product.product_detail_url,
                    });

                    setTextArea(`🔥 ${product.product_title}
                      \n✅ Por: product.target_app_sale_price} 😱😱
                      \n🛒 ${afiliateLink}
                      \n😎🚀 para mais ofertas acesse: ...`);
                    setLoadingTextArea(false);
                  } catch (error) {
                    console.log(error);
                  }
                }}
              >
                <Product product={product} />
              </DialogTrigger>
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <DialogHeader>
                  {!loadingTextArea ? (
                    <Textarea
                      cols={50}
                      rows={10}
                      value={textArea}
                      onChange={(el) => {
                        setTextArea(el.target.value);
                      }}
                      className=""
                    ></Textarea>
                  ) : (
                    <p>...</p>
                  )}
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() => navigator.clipboard.writeText(textArea)}
                  >
                    Copiar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </li>
        ))}
        {/* <Product product={objMockup}  /> */}
      </ul>
    </div>
  );
}
