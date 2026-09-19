"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Layout, Spin, Tabs } from "antd";

import { ProductCard } from "@/components/product-card";
import { StoreHeader } from "@/components/store-header";
import { BrandMark } from "@/components/brand-mark";
import { STORE_TAB_CATEGORIES } from "@/lib/constants";
import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

const { Content, Footer } = Layout;

const STORE_PAGE_SIZE = 20;

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    async function loadFirstPage() {
      setLoading(true);
      setError(null);
      setPage(1);
      try {
        const data = await listProducts({
          category: category === "all" ? undefined : category,
          page: 1,
          page_size: STORE_PAGE_SIZE,
        });
        setProducts(data.items);
        setHasNextPage(data.metadata.has_next_page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
        setProducts([]);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    }
    void loadFirstPage();
  }, [category]);

  async function loadMore() {
    if (!hasNextPage || loadingMore || loading) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await listProducts({
        category: category === "all" ? undefined : category,
        page: nextPage,
        page_size: STORE_PAGE_SIZE,
      });
      setProducts((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasNextPage(data.metadata.has_next_page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader active="store" overlay overlayLight />

      <section className="relative min-h-[70vh] overflow-hidden bg-hek-primary text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(160deg, #AE7820 0%, #8f6219 55%, #6e4b14 100%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
          <div className="store-hero-enter">
            <BrandMark size="lg" className="text-white" header="Store" />
            <p className="mt-6 max-w-md text-base text-white/85 sm:text-lg">
              Foot mats, door mats, center mats, rugs, and cleaning essentials —
              delivered in 1–3 business days.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#catalogue">
                <Button
                  type="default"
                  size="large"
                  className="border-white! bg-white! text-hek-primary!"
                >
                  Browse products
                </Button>
              </a>
              <Link href="/track">
                <Button ghost size="large" className="border-white/50! text-white!">
                  Track order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Content
        id="catalogue"
        className="mx-auto w-full max-w-6xl flex-1 scroll-mt-20 px-4 py-10 sm:px-6 sm:py-12"
      >
        <Tabs
          activeKey={category}
          onChange={setCategory}
          items={[
            { key: "all", label: "All" },
            ...STORE_TAB_CATEGORIES.map((c) => ({ key: c.value, label: c.label })),
          ]}
          className="mb-6"
        />
        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-hek-muted">No products yet — check back soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {hasNextPage ? (
              <div className="mt-10 flex justify-center">
                <Button
                  type="primary"
                  size="large"
                  loading={loadingMore}
                  onClick={() => void loadMore()}
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Content>
      <Footer className="border-t border-hek-primary/10 bg-white text-center text-sm text-hek-muted">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <BrandMark size="sm" className="text-hek-ink" />
          <span>© {new Date().getFullYear()}</span>
          <span aria-hidden>·</span>
          <Link href="/contact" className="text-hek-primary hover:underline">
            Contact
          </Link>
        </p>
      </Footer>
    </Layout>
  );
}
