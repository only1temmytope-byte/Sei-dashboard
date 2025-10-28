
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Card from "@/components/Card";
import SectionTitle from "@/components/SectionTitle";
import { ENDPOINTS } from "@/lib/endpoints";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const nfmt = new Intl.NumberFormat("en-US");

type TVLPoint = { date: number; tvl: number };

type GTResponse = {
  data: Array<{
    id: string;
    attributes: {
      name?: string;
      base_token_symbol?: string;
      base_token_price_usd?: string | number | null;
      price_change_percentage_24h?: number | null;
      volume_usd_24h?: string | number | null;
      trade_url?: string | null;
      dex?: string | null;
      dex_slug?: string | null;
      dex_name?: string | null;
    };
  }>;
  links?: { self?: string };
};

function useFetch<T>(url: string, init?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url, init)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) { setData(json as T); setError(null); }
      })
      .catch((e) => {
        if (!cancelled) { setError(e as Error); setData(null); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, error, loading };
}

export default function Page() {
  const { data: tvlRaw, error: tvlErr, loading: tvlLoading } = useFetch<TVLPoint[]>(ENDPOINTS.tvlHistory);
  const { data: poolsRaw, error: poolsErr, loading: poolsLoading } = useFetch<GTResponse>(ENDPOINTS.trendingPools, {
    headers: { Accept: "application/json" }
  });

  const tvl = useMemo(() => {
    if (!Array.isArray(tvlRaw)) return [] as { date: Date; tvl: number }[];
    return tvlRaw
      .filter((p) => typeof p.tvl === "number" && typeof p.date === "number")
      .map((p) => ({ date: new Date(p.date * 1000), tvl: p.tvl }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tvlRaw]);

  const tvlNow = tvl.length ? tvl[tvl.length - 1].tvl : null;
  const tvlPrev = tvl.length > 1 ? tvl[tvl.length - 2].tvl : null;
  const tvlDelta = tvlNow != null && tvlPrev != null ? ((tvlNow - tvlPrev) / Math.max(1, tvlPrev)) * 100 : null;

  const tvlChart = useMemo(() => {
    const last = tvl.slice(-60);
    return last.map((d) => ({ x: d.date.toISOString().slice(0, 10), y: Math.round(d.tvl) }));
  }, [tvl]);

  const trending = useMemo(() => {
    if (!poolsRaw || !poolsRaw.data) return [] as Array<{
      id: string; name: string; priceUsd: number | null; change24h: string | null; volume24h: number | null; url: string | null; dex: string;
    }>;
    return poolsRaw.data.map((item) => {
      const a = item.attributes || {};
      const dex = a.dex || a.dex_slug || a.dex_name || "";
      return {
        id: item.id,
        name: a.name || a.base_token_symbol || "unknown",
        priceUsd: a.base_token_price_usd == null ? null : Number(a.base_token_price_usd),
        change24h: a.price_change_percentage_24h == null ? null : a.price_change_percentage_24h.toFixed(2),
        volume24h: a.volume_usd_24h == null ? null : Number(a.volume_usd_24h),
        url: a.trade_url || poolsRaw.links?.self || null,
        dex,
      };
    });
  }, [poolsRaw]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
        <Card
          title="current tvl"
          value={tvlLoading ? "loading..." : tvlErr ? "error" : tvlNow != null ? currency.format(tvlNow) : "n/a"}
          sub={tvlDelta != null ? `${tvlDelta >= 0 ? "+" : ""}${tvlDelta.toFixed(2)}% day` : undefined}
        />
        <Card
          title="data points"
          value={tvlLoading ? "loading..." : tvlErr ? "error" : nfmt.format(tvl.length)}
          sub={tvl.length ? `since ${tvl[0].date.toISOString().slice(0, 10)}` : undefined}
        />
        <Card
          title="trending pools"
          value={poolsLoading ? "loading..." : poolsErr ? "error" : nfmt.format(trending.length)}
          sub={poolsErr ? String(poolsErr) : undefined}
        />
      </div>

      <div className="rounded-2xl shadow-sm border border-zinc-200 bg-white p-4 sm:p-6 mb-6 sm:mb-10">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>tvl history</SectionTitle>
          <div className="text-xs text-zinc-500">last ~60 days</div>
        </div>
        {tvlLoading ? (
          <div className="text-sm text-zinc-500">loading chart...</div>
        ) : tvlErr ? (
          <div className="text-sm text-red-600">failed to load tvl</div>
        ) : (
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tvlChart} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 10 }} minTickGap={20} />
                <YAxis tickFormatter={(v) => `${v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : nfmt.format(v)}`}
                  tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(val) => currency.format(Number(val))} labelFormatter={(l) => `date: ${l}`} />
                <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl shadow-sm border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>trending on sei</SectionTitle>
          <div className="text-xs text-zinc-500">from geckoterminal</div>
        </div>
        {poolsLoading ? (
          <div className="text-sm text-zinc-500">loading pools...</div>
        ) : poolsErr ? (
          <div className="text-sm text-red-600">failed to load trending pools</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-4">name</th>
                  <th className="py-2 pr-4">price</th>
                  <th className="py-2 pr-4">24h change</th>
                  <th className="py-2 pr-4">24h volume</th>
                  <th className="py-2 pr-4">dex</th>
                  <th className="py-2 pr-4">trade</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.priceUsd != null ? currency.format(Number(p.priceUsd)) : "n/a"}</td>
                    <td className={`py-2 pr-4 ${p.change24h != null && Number(p.change24h) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {p.change24h != null ? `${p.change24h}%` : "n/a"}
                    </td>
                    <td className="py-2 pr-4">{p.volume24h != null ? currency.format(Number(p.volume24h)) : "n/a"}</td>
                    <td className="py-2 pr-4">{p.dex || ""}</td>
                    <td className="py-2 pr-4">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-seired hover:underline font-medium">
                          open
                        </a>
                      ) : (
                        <span className="text-zinc-400">n/a</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
