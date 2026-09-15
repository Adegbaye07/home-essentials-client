"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Layout, Spin, Tabs } from "antd";

import { ProductCard } from "@/components/product-card";
import { StoreHeader } from "@/components/store-header";
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
      <StoreHeader active="store" overlay />
      <Content className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-4 sm:px-6">
        <header className="mb-8 pt-14 sm:pt-16">
          <h1 className="font-serif text-3xl text-hek-primary sm:text-4xl">
            Essentials by Kamgol
          </h1>
          <p className="mt-2 max-w-2xl text-hek-muted md:text-lg">
            Foot mats, door mats, center mats, rugs, and other home essentials.
          </p>
        </header>
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
        <p>
          Home Essentials by Kamgol © {new Date().getFullYear()}
          {" · "}
          <Link href="/contact" className="text-hek-primary hover:underline">
            Contact
          </Link>
        </p>
      </Footer>
    </Layout>
  );
}
