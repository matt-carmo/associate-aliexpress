import { useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { useCallback } from "react";

export const PaginationProducts = (): JSX.Element => {
 
    const searchParams = useSearchParams()
    const page = Number(searchParams.get("page"))
    const createQueryString = useCallback(
        (name: string, value: string) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(name, value)
     
          return params.toString()
        },
        [searchParams]
      )
     

    const generatePagination = () => {
        const items = [];
        const startPage = Math.max(page - 5, 0);
        for (let i = startPage; i < page + 5; i++) {
          items.push(
            <PaginationItem key={`page-${i}`}>
              <PaginationLink isActive={i + 1 === page} href={`?${createQueryString("page", (i + 1).toString())}`	}>{i + 1}</PaginationLink>
            </PaginationItem>
          );
        }

        return items;
      };
      
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        {generatePagination()}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
