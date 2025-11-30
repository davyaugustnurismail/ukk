// components/Tables/Instruktur/fetch-instruktur.ts

"use server";

export type InstrukturType = {
  id: number;
  name: string;
  photo: string;
  courses: number;
  students: number;
  rating: number;
};

export async function getInstrukturDashboard(): Promise<InstrukturType[]> {
  // Dummy delay simulasi loading
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      id: 1,
      name: "Alif Yusron",
      photo: "/images/user/user-01.png",
      courses: 12,
      students: 150,
      rating: 4.8,
    },
    {
      id: 2,
      name: "Nadya Lestari",
      photo: "/images/user/user-02.png",
      courses: 8,
      students: 90,
      rating: 4.5,
    },
    {
      id: 3,
      name: "Bima Saputra",
      photo: "/images/user/user-03.png",
      courses: 10,
      students: 120,
      rating: 4.7,
    },
    {
      id: 4,
      name: "Rara Salsabila",
      photo: "/images/user/user-04.png",
      courses: 7,
      students: 80,
      rating: 4.6,
    },
  ];
}
