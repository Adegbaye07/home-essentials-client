"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Layout, Spin, Tabs } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import { BespokeOrderForm } from "@/components/bespoke-order-form";
import { ProductCard } from "@/components/product-card";
import { StoreHeader } from "@/components/store-header";
import { BrandMark } from "@/components/brand-mark";
import { StoreHeroVideo } from "@/components/store-hero-video";
import { STORE_TAB_CATEGORIES } from "@/lib/constants";
import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

const { Content, Footer } = Layout;

const STORE_PAGE_SIZE = 20;
const CREATE_TAB = "create";
const SEARCH_DEBOUNCE_MS = 1000;

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const isCreate = category === CREATE_TAB;
  const searchQuery = debouncedSearch.trim();
  const listKeyRef = useRef(`${category}::${searchQuery}`);
  listKeyRef.current = `${category}::${searchQuery}`;

  useEffect(() => {
    if (isCreate) {
      setSearchInput("");
      setDebouncedSearch("");
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, isCreate]);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setProducts([]);
      setHasNextPage(false);
      setPage(1);
      return;
    }

    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setPage(1);
      try {
        const data = await listProducts({
          category: category === "all" ? undefined : category,
          q: searchQuery || undefined,
          page: 1,
          page_size: STORE_PAGE_SIZE,
        });
        if (cancelled) return;
        setProducts(data.items);
        setHasNextPage(data.metadata.has_next_page);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load products");
        setProducts([]);
        setHasNextPage(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [category, isCreate, searchQuery]);

  async function loadMore() {
    if (isCreate || !hasNextPage || loadingMore || loading) return;

    const nextPage = page + 1;
    const requestKey = listKeyRef.current;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await listProducts({
        category: category === "all" ? undefined : category,
        q: searchQuery || undefined,
        page: nextPage,
        page_size: STORE_PAGE_SIZE,
      });
      // Drop stale pages if the user changed category/search while loading.
      if (requestKey !== listKeyRef.current) return;
      setProducts((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasNextPage(data.metadata.has_next_page);
    } catch (e) {
      if (requestKey !== listKeyRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleCategoryChange(next: string) {
    setSearchInput("");
    setDebouncedSearch("");
    setCategory(next);
  }

  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader active="store" overlay overlayLight />

      <section className="relative min-h-[70vh] overflow-hidden bg-hek-ink text-white">
        <StoreHeroVideo />
        {/* Neutral shadow overlay — keep text readable without a gold wash */}
        <div
          className="pointer-events-none absolute inset-0 bg-black/45"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-black/25"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
          <div className="store-hero-enter">
            <BrandMark size="lg" className="text-white" header="Store" showIcon={false} />
            <p className="mt-6 max-w-md text-base text-white/85 sm:text-lg">
              General mats, foot mats, door mats, center mats, bath mats, rugs, cleaning and bathroom
              essentials — delivered in 1–3 business days.
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
        {isCreate ? (
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-hek-ink sm:text-3xl">
              Create a custom mat
            </h2>
            <p className="mt-2 max-w-2xl text-hek-muted md:text-lg">
              Send a sample photo. We review it, set a price that includes delivery, and email you a
              payment link if we can make it.
            </p>
          </div>
        ) : null}

        <Tabs
          activeKey={category}
          onChange={handleCategoryChange}
          items={[
            { key: CREATE_TAB, label: "Create" },
            { key: "all", label: "All" },
            ...STORE_TAB_CATEGORIES.map((c) => ({ key: c.value, label: c.label })),
          ]}
          className="mb-6"
        />

        {!isCreate ? (
          <div className="mb-6 max-w-md">
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-hek-muted" />}
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
          </div>
        ) : null}

        {isCreate ? (
          <BespokeOrderForm />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-hek-muted">
            {searchQuery ? "No products match your search." : "No products yet — check back soon."}
          </p>
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
