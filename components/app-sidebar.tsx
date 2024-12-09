import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
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
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <SidebarMenuItem key={item.title}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton asChild>
                  <span>{item.title}</span>
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
            </SidebarMenuItem>
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
      </SidebarContent>
    </Sidebar>

  );
}
