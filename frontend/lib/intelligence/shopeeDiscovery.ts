import type { DiscoverySource } from "./marketplaceDiscovery";

export const SHOPEE_DISCOVERY_SOURCES: DiscoverySource[] = [
    {
        id: "shopee-top-performing",
        label: "Shopee Top Performing",
        poolName: "Shopee Top Performing",
        description: "Best-selling products on Shopee with high commission",
        type: "products",
        query: {
            sortType: "2",
            listType: "2",
        },
        weight: 100,
        focusTags: ["shopee", "top", "trending"],
        accent: "from-orange-500 to-pink-500",
    },
    {
        id: "shopee-highest-commission",
        label: "Shopee Highest Commission",
        poolName: "Shopee Highest Commission",
        description: "Products with the best affiliate commission rates",
        type: "products",
        query: {
            sortType: "5",
            listType: "1",
        },
        weight: 95,
        focusTags: ["commission", "earnings", "profit"],
        accent: "from-green-500 to-emerald-500",
    },
    {
        id: "shopee-gaming",
        label: "Shopee Gaming",
        poolName: "Shopee Gaming",
        description: "Gaming accessories and electronics on Shopee",
        type: "products",
        query: {
            keyword: "gaming rgb earbuds console controller mouse keyboard headset",
            sortType: "2",
        },
        weight: 90,
        focusTags: ["gaming", "rgb", "audio", "pc"],
        accent: "from-purple-500 to-violet-500",
    },
    {
        id: "shopee-electronics",
        label: "Shopee Electronics",
        poolName: "Shopee Electronics",
        description: "Consumer electronics and gadgets",
        type: "products",
        query: {
            keyword: "smart device electronics gadget wireless headphones speaker",
            sortType: "2",
        },
        weight: 88,
        focusTags: ["electronics", "gadget", "smart"],
        accent: "from-cyan-500 to-blue-500",
    },
    {
        id: "shopee-deals",
        label: "Shopee Great Deals",
        poolName: "Shopee Great Deals",
        description: "Discounted products on Shopee",
        type: "products",
        query: {
            sortType: "3",
        },
        weight: 85,
        focusTags: ["deal", "discount", "sale"],
        accent: "from-red-500 to-rose-500",
    },
];
