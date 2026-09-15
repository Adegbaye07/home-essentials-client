"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";

import { brand } from "@/lib/brand";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: brand.primary,
            colorBgLayout: brand.bg,
            colorText: brand.ink,
            fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
            borderRadius: 8,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
