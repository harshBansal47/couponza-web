import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import CouponRow, { StoreMark } from "@/components/CouponRow";
import DisclosureNote from "@/components/DisclosureNote";
import Pagination from "@/components/Pagination";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const PAGE_SIZE = 20;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ skip?: string }>;

async function loadStore(slug: string) {
  try {
    return await api.getStoreBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) return {};

  const title = `${store.name} deals`;
  const description = store.description ?? `Verified coupons and deals for ${store.name}.`;
  const canonical = absoluteUrl(`/stores/${store.slug}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { skip: skipParam } = await searchParams;
  const skip = Math.max(Number(skipParam) || 0, 0);

  const store = await loadStore(slug);
  if (!store) notFound();

  const coupons = await api.listCoupons({ store_id: store.id, skip, limit: PAGE_SIZE });

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: store.name, path: `/stores/${store.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="flex items-center gap-4">
        <StoreMark name={store.name} logoUrl={store.logo_url} />
        <h1 className="font-serif text-3xl text-ink">{store.name}</h1>
      </div>
      {store.description && <p className="mt-2 text-ink-soft">{store.description}</p>}

      <div className="mt-6">
        <DisclosureNote commissionDisclosure={store.commission_disclosure} />
      </div>

      <div className="mt-10">
        <h2 className="mb-2 font-serif text-xl text-ink">Active deals</h2>
        {coupons.items.length === 0 ? (
          <p className="py-8 text-ink-soft">No active deals for {store.name} right now.</p>
        ) : (
          <div>
            {coupons.items.map((coupon) => (
              <CouponRow key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
        <Pagination
          basePath={`/stores/${store.slug}`}
          searchParams={{}}
          skip={skip}
          limit={PAGE_SIZE}
          total={coupons.total}
        />
      </div>
    </div>
  );
}
