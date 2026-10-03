import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, resilient } from "@/lib/api";
import CategoryChips from "@/components/CategoryChips";
import CouponRow from "@/components/CouponRow";
import Pagination from "@/components/Pagination";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const PAGE_SIZE = 20;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ skip?: string }>;

async function loadCategory(slug: string) {
  try {
    return await resilient.getCategoryBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) return {};

  const title = `${category.name} deals`;
  const canonical = absoluteUrl(`/categories/${category.slug}`);
  return {
    title,
    alternates: { canonical },
    openGraph: { title, url: canonical },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { skip: skipParam } = await searchParams;
  const skip = Math.max(Number(skipParam) || 0, 0);

  const category = await loadCategory(slug);
  if (!category) notFound();

  const [coupons, categories, stores] = await Promise.all([
    resilient.listCoupons({ category_id: category.id, skip, limit: PAGE_SIZE }),
    resilient.listCategories(),
    resilient.listStores({ limit: 100 }),
  ]);
  const storeById = new Map(stores.items.map((s) => [s.id, s]));

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/categories/${category.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <h1 className="mb-6 font-serif text-3xl text-ink">{category.name}</h1>
      <div className="mb-8">
        <CategoryChips categories={categories.items} activeSlug={category.slug} />
      </div>

      {coupons.items.length === 0 ? (
        <p className="py-12 text-center text-ink-soft">No active deals in {category.name} right now.</p>
      ) : (
        <div>
          {coupons.items.map((coupon) => {
            const store = storeById.get(coupon.store_id);
            return (
              <CouponRow
                key={coupon.id}
                coupon={coupon}
                store={store ? { name: store.name, logoUrl: store.logo_url } : undefined}
              />
            );
          })}
        </div>
      )}
      <Pagination
        basePath={`/categories/${category.slug}`}
        searchParams={{}}
        skip={skip}
        limit={PAGE_SIZE}
        total={coupons.total}
      />
    </div>
  );
}
