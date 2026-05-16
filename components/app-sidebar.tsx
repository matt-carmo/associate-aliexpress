import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Flame, Home, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Discovery",
    subItems: [
      {
        title: "Discover",
        url: "/discover",
      },
      {
        title: "Viral Tech",
        url: "/viral-tech",
      },
      {
        title: "Telegram Candidates",
        url: "/telegram-candidates",
      },
    ],
  },
  {
    title: "AliexPress",
    subItems: [
      {
        title: "Hot Products",
        url: "/aliexpress/hot-products",
      },
      {
        title: "Featured Promo",
        url: "/aliexpress/featured-promo",
      },
      {
        title: "Products",
        url: "/aliexpress/products",
      },
          {
            title: "Curated — Best",
            url: "/aliexpress/curated",
          },
          {
            title: "Telegram Ready",
            url: "/aliexpress/telegram-ready",
          },
          {
            title: "Trending Tech",
            url: "/aliexpress/trending-tech",
          },
          {
            title: "High Commission",
            url: "/aliexpress/high-commission",
          },
          {
            title: "Hidden Gems",
            url: "/aliexpress/hidden-gems",
          },
          {
            title: "Best Discounts",
            url: "/aliexpress/best-discounts",
          },
          {
            title: "Gaming",
            url: "/aliexpress/gaming",
          },
          {
            title: "Setup",
            url: "/aliexpress/setup",
          },
          {
            title: "Smart Home",
            url: "/aliexpress/smart-home",
          },
          {
            title: "Audio",
            url: "/aliexpress/audio",
          },
    ],
  },
  // ,
  // {
  //   title: "Calendar",
  //   url: "#",
  //   icon: Calendar,
  // },
  // {
  //   title: "Search",
  //   url: "#",
  //   icon: Search,
  // },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton asChild>
                  <span className="inline-flex items-center gap-2">
                    {item.title === "Discovery" ? <Sparkles className="h-4 w-4" /> : item.title === "AliexPress" ? <Flame className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.subItems && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
              </Collapsible>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>

  );
}
