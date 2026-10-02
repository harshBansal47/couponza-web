import { formatDate, formatMoney } from "@/lib/format";
import type { PricePoint } from "@/lib/types";

/**
 * Price history as a table rather than a chart.
 *
 * A chart needs a drawing library and no server-rendered equivalent; a table is
 * readable, accessible, works without JavaScript, and is honest about the data —
 * which is sparse and irregular. The sparkline shape is implied by the sequence.
 */

function Change({ points, currency }: { points: PricePoint[]; currency: string }) {
  if (points.length < 2) {
    return (
      <p className="mt-4 text-sm text-ink-soft">
        Not enough captures yet to show a trend.
      </p>
    );
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const isDown = changePct < 0;
  const isFlat = Math.abs(changePct) < 0.5;

  return (
    <p className="mt-4 text-sm text-ink-soft">
      {isFlat ? (
        <>Price is holding at {formatMoney(last, currency)}.</>
      ) : (
        <>
          {isDown ? "Down" : "Up"} {Math.abs(changePct).toFixed(0)}% since{" "}
          {formatDate(points[0].captured_at)} — from {formatMoney(first, currency)} to{" "}
          {formatMoney(last, currency)}.
        </>
      )}
    </p>
  );
}

export default function PriceHistory({
  points,
  currency,
  limit = 30,
}: {
  points: PricePoint[];
  currency: string;
  limit?: number;
}) {
  if (points.length === 0) {
    return (
      <div className="mt-4 border border-dashed border-ledger-line px-6 py-10 text-center text-sm text-ink-soft">
        We have not captured a price for this product yet. Once we do, every capture is listed
        here — no smoothed line, no flattering window.
      </div>
    );
  }

  // Newest first, and capped: an unbounded table is not useful on the page.
  const recent = [...points].sort((a, b) => b.captured_at.localeCompare(a.captured_at)).slice(0, limit);

  return (
    <>
      <Change points={recent} currency={currency} />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <caption className="sr-only">Captured prices, newest first</caption>
          <thead>
            <tr className="border-b border-ledger-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th scope="col" className="py-2 pr-4 font-medium">
                Captured
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Price
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                List price
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                In stock
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((point) => (
              <tr key={point.id} className="border-b border-ledger-line/60">
                <th scope="row" className="py-2 pr-4 text-left font-mono text-xs font-normal text-ink-soft">
                  {formatDate(point.captured_at)}
                </th>
                <td className="py-2 pr-4 text-right font-mono text-ink">
                  {formatMoney(point.price, currency)}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-ink-soft">
                  {point.original_price !== null ? formatMoney(point.original_price, currency) : "—"}
                </td>
                <td className="py-2 text-right text-ink-soft">
                  {point.in_stock ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {points.length > limit && (
        <p className="mt-3 text-xs text-ink-soft">
          Showing the {limit} most recent of {points.length} captures.
        </p>
      )}
    </>
  );
}