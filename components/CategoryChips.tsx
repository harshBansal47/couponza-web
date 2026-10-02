import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            category.slug === activeSlug
              ? "border-ink bg-ink text-paper"
              : "border-ledger-line text-ink-soft hover:border-ink hover:text-ink"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
