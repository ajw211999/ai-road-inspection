"use client";

import { useDeferredValue, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  onSearch,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const deferredValue = useDeferredValue(value);

  // Call onSearch when deferred value changes
  if (deferredValue !== value) {
    // Value is stale — let React handle re-render
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch(newValue);
  }

  function handleClear() {
    setValue("");
    onSearch("");
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
