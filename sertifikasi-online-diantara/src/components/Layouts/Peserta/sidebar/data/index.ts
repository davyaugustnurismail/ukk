import * as Icons from "../icons";

export interface SubNavItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  icon: React.ComponentType<any>;
  items: SubNavItem[];
  url?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/peserta/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
    ],
  },
];
