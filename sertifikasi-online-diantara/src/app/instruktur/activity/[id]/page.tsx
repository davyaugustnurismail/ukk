"use client";

import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";
import TemplateSelector from "@/components/TemplateSelector";
import TemplateApproval from "./TemplateApproval";
import PesertaSection from "./PesertaSection";

export default function ActivityDetailInstruktur({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [activity, setActivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract template data
  const templateId = activity?.sertifikat_id || null;
  const templateName = activity?.sertifikat?.name || null;

  // Helper untuk format jam:menit AM/PM
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "-";
    const [hourStr, minuteStr] = timeString.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    if (isNaN(hour)) return "-";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  };

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await axios.get(`/data-activities/${id}`);
        const activityData = response.data.data || response.data;
        // Fetch instructor data if we have an instructor_id
        if (activityData.instruktur_id) {
          try {
            const instrukturResponse = await axios.get(
              `/instruktur/${activityData.instruktur_id}`,
            );
            const instrukturData =
              instrukturResponse.data.data && instrukturResponse.data.data.name
                ? instrukturResponse.data.data
                : instrukturResponse.data.name
                  ? instrukturResponse.data
                  : null;
            if (instrukturData && instrukturData.name) {
              activityData.instruktur_name = instrukturData.name;
            } else {
              activityData.instruktur_name = "Instruktur tidak ditemukan";
            }
          } catch {
            activityData.instruktur_name = "Instruktur tidak ditemukan";
          }
        }

        let formattedDate = "-";
        if (activityData.date) {
          try {
            const months = [
              "Januari",
              "Februari",
              "Maret",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Agustus",
              "September",
              "Oktober",
              "November",
              "Desember",
            ];
            const date = new Date(activityData.date.split("T")[0]);
            if (!isNaN(date.getTime())) {
              const day = date.getDate();
              const month = months[date.getMonth()];
              const year = date.getFullYear();
              formattedDate = `${day} ${month} ${year}`;
            }
          } catch {
            formattedDate = "-";
          }
        }
        const formattedActivity = {
          ...activityData,
          formattedDate,
          activity_name: activityData.activity_name || "Tidak ada nama",
          activity_type_name:
            (activityData.activity_type &&
              activityData.activity_type.type_name) ||
            activityData.activity_type_name ||
            "Tidak ada tipe",
          instruktur_name:
            activityData.instruktur_name || "Tidak ada instruktur",
          description: activityData.description || "Tidak ada deskripsi",
          time_start: formatTime(activityData.time_start),
          time_end: formatTime(activityData.time_end),
        };
        setActivity(formattedActivity);
      } catch {
        setActivity(null);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          Aktivitas tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/instruktur/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-primary"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Kembali ke Daftar Aktivitas
        </Link>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-[#122031]">
        <div className="mb-4 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activity.activity_name}
          </h1>
        </div>
        <div className="mb-8 grid gap-4 rounded-lg bg-gray-50 p-8 dark:bg-gray-800/50">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tanggal
              </h2>
              <p className="text-xl font-medium text-gray-900 dark:text-white">
                {activity.formattedDate}
              </p>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Jam Mulai
                </h2>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {activity.time_start || "-"}
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Jam Selesai
                </h2>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {activity.time_end || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tipe Aktivitas
              </h2>
              <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-lg font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {activity.activity_type_name}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Instruktur
              </h2>
              <p className="text-xl font-medium text-gray-900 dark:text-white">
                {activity.instruktur_name || "-"}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Partisipan
              </h2>
              <div className="flex flex-col gap-1">
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {((activity.peserta?.length || 0) + (activity.panitia?.length || 0) + (activity.narasumber?.length || 0))} Orang
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ({activity.peserta?.length || 0} Peserta, {activity.panitia?.length || 0} Panitia, {activity.narasumber?.length || 0} Narasumber)
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Lokasi
              </h2>
              {activity.location ? (
                activity.location.startsWith('http://') || activity.location.startsWith('https://') ? (
                  <a 
                    href={activity.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {activity.location}
                  </a>
                ) : (
                  <p className="text-xl font-medium text-gray-900 dark:text-white">
                    {activity.location}
                  </p>
                )
              ) : (
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  Tidak ada lokasi
                </p>
              )}
            </div>

            <div className="md:col-span-full">
              {/*disini untuk preview sertifikat*/}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Deskripsi
          </h2>
          <div
            className="prose prose-sm max-w-none overflow-auto break-words text-gray-700 dark:prose-invert sm:prose lg:prose-lg dark:text-gray-300"
            style={{ maxHeight: "400px" }}
            dangerouslySetInnerHTML={{ __html: activity.description }}
          ></div>
        </div>
      </div>

      <TemplateApproval activityId={id} />

      <PesertaSection activityId={id} />
    </div>
  );
}
