export interface SubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: SubItem[];
  url?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export type NavData = NavSection[];
