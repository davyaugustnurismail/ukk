import darkLogo from "@/assets/logos/DiAntara_white.svg";
import logo from "@/assets/logos/DiAntara_Black.svg";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className="flex w-full items-center justify-center py-4">
      <div className={cn("relative -mt-7 h-15 w-[200px]", className)}>
        <Image
          src={logo}
          fill
          className="mx-auto object-contain dark:hidden"
          alt="DiAntara logo"
          quality={100}
          priority
        />
        <Image
          src={darkLogo}
          fill
          className="mx-auto hidden object-contain dark:block"
          alt="DiAntara logo (dark)"
          quality={100}
          priority
        />
      </div>
    </div>
  );
}
