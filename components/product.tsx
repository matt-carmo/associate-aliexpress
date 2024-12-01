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

export const Product = (props: Product): JSX.Element => {
  const product = props.product;
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex gap-x-5">
          <Image
            src={product.product_main_image_url}
            alt={product.product_title}
            width={100}
            height={100}
            className="object-contain aspect-square"
          />
          <CardTitle className="text-sm line-clamp-3 h-fit">{product.product_title}</CardTitle>
        </div>
        
      </CardHeader>
     
      {/* <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter> */}
    </Card>
  );
};
