import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/admin",
        items: [],
      },
      {
        title: "Activity",
        icon: Icons.Clipboard,
        items: [
          {
            title: "Activity Types",
            url: "/admin/activity-type",
          },
          {
            title: "Activities Management",
            url: "/admin/activity-management",
          },
        ],
      },
      {
        title: "User Management",
        icon: Icons.UserGroup,
        items: [
          {
            title: "Admin",
            url: "/admin/users/admin-management",
          },
          {
            title: "Instruktur",
            url: "/admin/users/instruktur-management",
          },
          {
            title: "Peserta",
            url: "/admin/users/peserta-management",
          },
        ],
      },
      {
        title: "Sertifikat",
        icon: Icons.Newspaper,
        url: "/admin/tabel-sertifikat",
        items: [],
      },
    ],
  },
];
