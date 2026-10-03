"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? searchParams.get("search") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" role="search">
      <label htmlFor="deal-search" className="sr-only">
        Search deals or stores
      </label>
      <input
        id="deal-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search deals or stores"
        className="flex-1 rounded-sm border border-ledger-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-inkblue outline-none"
      />
      <button
        type="submit"
        className="btn btn-outline"
      >
        Search
      </button>
    </form>
  );
}
