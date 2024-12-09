import { cn } from "@/lib/utils";

import { Input } from "./ui/input";

import { Button } from "./ui/button";

import React, { useContext } from "react";
import FilterProvider, { useFilterContext } from "@/hooks/filters";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { categories } from "@/lib/utils/categories";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const Search = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { search, setSearch } = useFilterContext();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    };
    return (
      <Input
        type="text"
        value={search}
        onChange={handleChange}
        placeholder="Pesquisar"
        className="w-[350px]"
      />
    );
  }
);
const FiltersGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { search,  _selectCategory, _selectPromo, selectSort} = useFilterContext();

  const { count, setCount } = useFilterContext();
  const searchParams = useSearchParams().get('search') || '';
  const page = useSearchParams().get('page') || '';
  const router = useRouter();

  const handleChange = () => {
    router.push(`?search=${search}&category=${_selectCategory}&promo=${_selectPromo}&sort=${selectSort}&page=${page}`);
    setCount(count + 1);
     }

  return (
    <div ref={ref} className={cn("flex gap-x-2", className)} {...props}>
      {props.children}
      <Button variant="default" onClick={handleChange}>Filtrar</Button>
    </div>
  );
});
Search.displayName = "SidebarGroup";


const SelectCategory = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const { _selectCategory, _setSelectCategory } = useFilterContext();
  const [categoryName, setCategoryName] = React.useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {_selectCategory
            ? categories.find((category) => category.category_id.toString() === _selectCategory)?.category_name
            : "Selecione uma categoria"}
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
                    setCategoryName(category.category_name || "");
                    _setSelectCategory(
                      currentValue === categoryName
                        ? ''
                        : category.category_id.toString()
                    );
                    
                    setOpen(false)
                  }}
                >
                  {category.category_name}
                  <Check
                    className={cn(
                      "ml-auto",
                      _selectCategory === category.category_id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
const SelectPromos = React.forwardRef<
  HTMLDivElement,
  
  React.ComponentProps<"div"> & { arr: Record<string, any>[] }
>(({ className, arr, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const { _selectPromo, _setSelectPromo } = useFilterContext();


  return (
   
 
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {_selectPromo
            ? arr.find((promo) => promo.promo_name.toString() === _selectPromo)?.promo_name
            : "Selecione uma Promoção"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {arr && arr.map((promo) => (
                <CommandItem
                  key={promo.promo_name}
                  value={promo.promo_name}
                  onSelect={(currentValue) => {
                    
                    _setSelectPromo(
                      currentValue === _selectPromo
                        ? ''
                        : promo.promo_name.toString()
                    );
           
                    setOpen(false)
                  }}
                >
                  {promo.promo_name}
                  <Check
                    className={cn(
                      "ml-auto",
                      _selectPromo === promo.promo_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
 
  );
});
const SelectSortFeatured = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { options: string[] }
>(({ className, options, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const { selectSort, setSelectSort } = useFilterContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selectSort
            ? options.find((option) => option === selectSort)
            : "Selecione uma ordenação"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar ordenação..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    setSelectSort(
                      currentValue === selectSort ? '' : option
                    );
                    setOpen(false);
                  }}
                >
                  {option}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectSort === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export { Search, FiltersGroup, SelectCategory, SelectPromos, SelectSortFeatured };