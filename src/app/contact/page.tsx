"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  InstagramOutlined,
  MailOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { Layout } from "antd";

import { StoreHeader } from "@/components/store-header";
import { contact, contactLinks } from "@/lib/contact";

const { Content } = Layout;

type ContactRowProps = {
  icon: ReactNode;
  label: string;
  href: string;
  children: ReactNode;
  external?: boolean;
};

function ContactRow({ icon, label, href, children, external }: ContactRowProps) {
  return (
    <div className="flex gap-4 border-b border-hek-primary/10 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hek-primary/10 text-hek-primary"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-hek-muted">{label}</p>
        <a
          href={href}
          className="mt-1 block text-base font-medium text-hek-primary hover:underline"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader active="contact" />
      <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl text-hek-ink">Contact us</h1>
        <p className="mt-2 text-sm text-hek-muted">
          Questions about orders, products, or delivery, we&apos;re happy to help.
        </p>

        <div className="mt-8 rounded-xl border border-hek-primary/15 bg-white p-6 shadow-sm">
          <ContactRow
            icon={<MailOutlined style={{ fontSize: 20 }} />}
            label="Email"
            href={contactLinks.mailto}
          >
            {contact.email}
          </ContactRow>
          <ContactRow
            icon={<PhoneOutlined style={{ fontSize: 20 }} />}
            label="Phone"
            href={contactLinks.tel}
          >
            {contact.phoneDisplay}
          </ContactRow>
          <ContactRow
            icon={<WhatsAppOutlined style={{ fontSize: 20 }} />}
            label="WhatsApp"
            href={contactLinks.whatsapp}
            external
          >
            Chat on WhatsApp ({contact.phoneDisplay})
          </ContactRow>
          <ContactRow
            icon={<InstagramOutlined style={{ fontSize: 20 }} />}
            label="Instagram"
            href={contactLinks.instagram}
            external
          >
            @{contact.instagramHandle}
          </ContactRow>
        </div>

        <p className="mt-6 text-center text-sm text-hek-muted">
          <Link href="/store" className="text-hek-primary hover:underline">
            Back to shop
          </Link>
        </p>
      </Content>
    </Layout>
  );
}
