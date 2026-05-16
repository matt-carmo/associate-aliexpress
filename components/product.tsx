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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * Get quality badge color based on score
 */
const getQualityBadge = (product: any) => {
  // Check if product has intelligence score
  const score = (product as any).score;
  if (!score) return null;

  if (score >= 80) return { color: "bg-green-500", label: "⭐ Excellent" };
  if (score >= 65) return { color: "bg-blue-500", label: "✨ Good" };
  if (score >= 50) return { color: "bg-yellow-500", label: "👍 Fair" };
  return { color: "bg-gray-400", label: "Basic" };
};

/**
 * Format rating for display
 */
const formatRating = (rating: string | number | undefined): string => {
  if (!rating) return "N/A";
  const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
  return numRating.toFixed(1);
};

/**
 * Format volume for display
 */
const formatVolume = (volume: number | undefined): string => {
  if (!volume) return "N/A";
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toString();
};

export const Product = (props: { product: Product }): JSX.Element => {
  const product = props.product;
  const price_commission_rate = (
    (parseFloat(props.product.commission_rate.replace("%", "")) / 100) *
    parseFloat(product.original_price)
  ).toFixed(2);

  const qualityBadge = getQualityBadge(product);
  const rating = formatRating((product as any).evaluate_rate);
  const volume = formatVolume((product as any).lastest_volume);
  const hasPromo = product.promo_code_info && product.promo_code_info.promo_code;

  return (
    <Card className={`w-full relative overflow-hidden ${hasPromo ? "bg-yellow-50 border-yellow-300" : ""}`}>
      {/* Quality Badge */}
      {qualityBadge && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${qualityBadge.color} text-white text-xs font-bold px-2 py-1 absolute top-2 right-2 rounded z-10`}>
                {qualityBadge.label}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Quality Score: {(product as any).score || "—"}/100</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Promo Badge */}
      {hasPromo && (
        <div className="bg-yellow-400 text-xs font-bold px-2 py-1 absolute top-2 left-2 rounded z-10">
          🎁 PROMO
        </div>
      )}

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

        {/* Quality Signals Row */}
        <div className="w-full flex gap-1 text-xs py-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-center flex-1">
                  ⭐ {rating}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rating: {rating}/5.0</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-center flex-1">
                  📊 {volume}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sales Volume: {volume} units</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-center flex-1">
                  {product.commission_rate}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Affiliate Commission Rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Pricing Section */}
        <div className="flex items-center gap-x-2 w-full">
          <div className="bg-yellow-100 px-2 py-0.5 rounded-xl font-medium text-sm flex-shrink-0">
            <span>{product.commission_rate}</span>
            <span className="mx-1">|</span>
            <span>R${price_commission_rate}</span>
          </div>
          <div className="flex-1">
            <span className="text-md font-semibold">
              R${product.target_sale_price}
            </span>
            <span className="text-xs line-through ml-1">
              R${product.target_original_price}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
