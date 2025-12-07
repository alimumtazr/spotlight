"use client";
import { useRouter, usePathname } from "next/navigation";

export default function ModeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const isScanner = pathname === "/scanner";

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-gray-900 rounded-lg p-1.5 border-2 border-gray-800 shadow-xl">
        <div className="flex gap-1">
          <button
            onClick={() => router.push("/")}
            type="button"
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
              !isScanner
                ? "bg-blue-600 text-white border-blue-500 shadow-lg"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
            }`}
          >
            User Mode
          </button>
          <button
            onClick={() => router.push("/scanner")}
            type="button"
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
              isScanner
                ? "bg-blue-600 text-white border-blue-500 shadow-lg"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
            }`}
          >
            Guard Mode
          </button>
        </div>
      </div>
    </div>
  );
}

