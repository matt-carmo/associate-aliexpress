import Image from "next/image";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";

export const Product = (props: { product: Product }): JSX.Element => {
  const product = props.product;
  const price_commission_rate = (
    (parseFloat(props.product.commission_rate.replace("%", "")) / 100) *
    parseFloat(product.original_price)
  ).toFixed(2);

  return (
    <Card className={`w-full  ${product.promo_code_info && "bg-yellow-100"}`}>
      <CardHeader className={`pb-2 pt-2`}>
        <div className="flex justify-center items-center">
          <Image
            src={product.product_main_image_url}
            alt={product.product_title}
            width={200}
            height={200}
            className="object-contain aspect-square w-[200px] h-[200px]"
          />
        </div>
      </CardHeader>

      <CardFooter className="gap-x-1 pb-2 flex-col">
        <CardTitle className="text-xs line-clamp-2 h-fit">
          {product.product_title}
        </CardTitle>
        <div className="flex items-center gap-x-2">
        <div className="bg-yellow-100 px-2 py-0.5 rounded-xl font-medium text-sm">
          <span>{product.commission_rate}</span>
          <span className="mx-1">|</span>
          <span>R${price_commission_rate}</span>
        </div>
        <div>
        <span className="text-md font-semibold">
          R${product.target_sale_price}
        </span>
        <span
          className="text-xs line-through mt-0.5+
        "
        >
          R${product.target_original_price}
        </span>
        </div>
        </div>
      </CardFooter>
    </Card>
  );
};
