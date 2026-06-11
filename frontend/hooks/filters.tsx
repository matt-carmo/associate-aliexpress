import { useSearchParams } from "next/navigation";
import { createContext, ReactNode, useState, useContext } from "react";

interface FilterContextType {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  _selectCategory: string;
  _setSelectCategory: React.Dispatch<React.SetStateAction<string>>;
  _selectPromo: string;
  _setSelectPromo: React.Dispatch<React.SetStateAction<string>>;
  selectSort: string;
  setSelectSort: React.Dispatch<React.SetStateAction<string>>;
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);


export default function FilterProvider  ({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams().get('search') || '';
  const category = useSearchParams().get('category') || '';
  const promo = useSearchParams().get('promo') || '';
  const sort = useSearchParams().get('sort') || '';
  const page = useSearchParams().get('page') || '';
  
  const [search, setSearch] = useState<string>(searchParams);
  const [count, setCount] = useState<number>(0);
  const [_selectCategory, _setSelectCategory] = useState<string>(category);
  const [_selectPromo, _setSelectPromo] = useState<string>(promo);

  const [selectSort, setSelectSort] = useState<string>(sort);
  return (
    <FilterContext.Provider value={{ search, _selectPromo,_setSelectPromo,selectSort, setSelectSort, setSearch, _selectCategory, _setSelectCategory, count, setCount }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};


// Hook para consumir o contexto


