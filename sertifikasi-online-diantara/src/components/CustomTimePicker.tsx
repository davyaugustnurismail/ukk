import React, { useState, useRef, useEffect } from "react";

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, "0"),
);

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih waktu",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState<string>(value ? value.split(":")[0] : "");
  const [minute, setMinute] = useState<string>(
    value ? value.split(":")[1] : "",
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHour(value ? value.split(":")[0] : "");
    setMinute(value ? value.split(":")[1] : "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = e.target.value;
    setHour(h);
    if (minute) onChange(`${h}:${minute}`);
    else onChange(`${h}:00`);
  };
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = e.target.value;
    setMinute(m);
    setOpen(false);
    onChange(`${hour || "00"}:${m}`);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        value={hour && minute ? `${hour}:${minute}` : ""}
        placeholder={placeholder}
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
      />
      {open && (
        <div className="absolute left-0 top-12 z-50 flex w-full flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-[#1a2233]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Jam
            </label>
            <select
              value={hour}
              onChange={handleHourChange}
              className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
            >
              <option value="" disabled>
                Pilih jam
              </option>
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Menit
            </label>
            <select
              value={minute}
              onChange={handleMinuteChange}
              className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
            >
              <option value="" disabled>
                Pilih menit
              </option>
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
