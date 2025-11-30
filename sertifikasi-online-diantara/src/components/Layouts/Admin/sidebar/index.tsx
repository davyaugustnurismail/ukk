"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import ClientOnly from "@/components/ClientOnly";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  // Auto-expand only on route change, not on every render

  useEffect(() => {
    let foundItemTitle: string | null = null;
    let hasMatchingPath = false;

    NAV_DATA.forEach((section) => {
      section.items.forEach((item) => {
        if (item.items && item.items.length > 0) {
          const hasActiveChild = item.items.some(
            (subItem) => subItem.url === pathname,
          );
          if (hasActiveChild) {
            foundItemTitle = item.title;
            hasMatchingPath = true;
          }
        } else if (
          (!item.items || item.items.length === 0) &&
          "url" in item &&
          item.url === pathname
        ) {
          hasMatchingPath = true;
        }
      });
    });

    if (hasMatchingPath && foundItemTitle) {
      setExpandedItems([foundItemTitle]);
    } else if (!hasMatchingPath) {
      setExpandedItems([]);
    }
  }, [pathname]);

  return (
    <ClientOnly>
    <>
      

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark",
          "sticky top-0 h-screen",
          "w-[290px] translate-x-0 opacity-100 shadow-xl",
          "transition-all duration-500 ease-in-out",
        )}>
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span>{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItems.includes(item.title) &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-3"
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title}</span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
    </ClientOnly>
  );
}
