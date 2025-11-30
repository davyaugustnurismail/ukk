import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerFieldProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function DatePickerField({
  value,
  onChange,
  className,
}: DatePickerFieldProps) {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={wrapperRef}
      className={`w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white ${className}`}
      onClick={() => {
        if (wrapperRef.current) {
          const input = wrapperRef.current.querySelector("input");
          if (input) {
            input.click();
          }
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <DatePicker
        selected={(() => {
          if (!value) return null;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split("/");
            return new Date(Number(year), Number(month) - 1, Number(day));
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return new Date(value);
          }
          return null;
        })()}
        onChange={(date) => {
          if (!date) {
            onChange("");
            return;
          }
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          onChange(`${day}/${month}/${year}`);
        }}
        minDate={oneWeekAgo}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        autoComplete="off"
        customInput={
          <input
            readOnly
            inputMode="none"
            className="w-full bg-transparent outline-none"
            onKeyDown={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            tabIndex={-1}
            style={{ caretColor: "transparent" }}
          />
        }
      />
    </div>
  );
}
