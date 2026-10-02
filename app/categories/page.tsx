import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse coupons and deals by category.",
  alternates: { canonical: absoluteUrl("/categories") },
};

export default async function CategoriesIndexPage() {
  const { items } = await api.listCategories({ limit: 100 });
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl text-ink">Categories</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="border border-ledger-line bg-paper-raised px-4 py-6 text-ink transition-colors hover:border-inkblue hover:text-inkblue"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
