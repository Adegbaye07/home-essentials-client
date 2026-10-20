"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { createCustomOrder } from "@/lib/api";

const MAX_SAMPLE_BYTES = 5 << 20;
const ACCEPT_TYPES = "image/jpeg,image/png,image/webp,image/gif";

type FormValues = {
  title: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
};

export function BespokeOrderForm() {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSample() {
    setSampleFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function setSample(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setSampleFile(file);
  }

  const fileList: UploadFile[] = sampleFile
    ? [
        {
          uid: "-1",
          name: sampleFile.name,
          status: "done",
          url: previewUrl ?? undefined,
          thumbUrl: previewUrl ?? undefined,
        },
      ]
    : [];

  async function onFinish(values: FormValues) {
    if (!sampleFile) {
      message.error("Please add a sample image");
      return;
    }
    if (!(typeof values.quantity === "number" && values.quantity >= 1)) {
      message.error("Quantity must be at least 1");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createCustomOrder({
        title: values.title.trim(),
        quantity: values.quantity,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        deliveryAddress: values.deliveryAddress.trim(),
        sampleImage: sampleFile,
      });
      setTrackingNumber(order.trackingNumber ?? null);
      setCustomerEmail(order.customer?.email ?? values.email.trim());
      message.success("Request submitted — save your tracking ID");
      form.resetFields();
      clearSample();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (trackingNumber) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-hek-primary/15 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl text-hek-ink">Request received</h2>
        <p className="mt-2 text-hek-muted">
          We will review your sample and contact you with a price or a decision. Use your
          tracking ID to follow status.
        </p>
        <p className="mt-6 text-sm text-hek-muted">Tracking ID</p>
        <p className="font-mono text-lg font-semibold text-hek-ink">{trackingNumber}</p>
        {customerEmail ? (
          <p className="mt-2 text-sm text-hek-muted">
            Track with the email you submitted:{" "}
            <span className="text-hek-ink">{customerEmail}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/track"
            className="inline-flex items-center justify-center rounded-lg bg-hek-primary px-4 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
          >
            Track request
          </Link>
          <Button
            onClick={() => {
              setTrackingNumber(null);
              setCustomerEmail(null);
            }}
          >
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-hek-primary/15 bg-white p-5 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl text-hek-ink">Send us a sample</h2>
      <p className="mt-1 mb-3 text-sm text-hek-muted">
        Upload a photo of the mat you want made. We will quote a price that includes delivery.
      </p>

      <Form
        form={form}
        layout="vertical"
        className="mt-6"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true }]}>
          <Input size="large" placeholder="e.g. Soft hallway mat, beige pattern" />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[
            { required: true, type: "number", min: 1, message: "Enter a quantity of at least 1" },
          ]}
        >
          <InputNumber min={1} size="large" className="w-full!" placeholder="How many mats?" />
        </Form.Item>

        <Form.Item label="Sample image" required>
          <Upload
            listType="picture-card"
            accept={ACCEPT_TYPES}
            maxCount={1}
            fileList={fileList}
            beforeUpload={(file) => {
              if (!ACCEPT_TYPES.split(",").includes(file.type)) {
                message.error("Use JPEG, PNG, WebP, or GIF");
                return Upload.LIST_IGNORE;
              }
              if (file.size > MAX_SAMPLE_BYTES) {
                message.error("Image must be 5MB or smaller");
                return Upload.LIST_IGNORE;
              }
              setSample(file);
              return false;
            }}
            onRemove={() => {
              clearSample();
              return true;
            }}
          >
            {fileList.length >= 1 ? null : (
              <div className="flex flex-col items-center gap-1 text-hek-muted">
                <PlusOutlined />
                <span className="text-xs">Add photo</span>
              </div>
            )}
          </Upload>
          <p className="mt-1 text-xs text-hek-muted">
            Preview only until you submit — nothing uploads until then.
          </p>
        </Form.Item>

        <h3 className="mb-3 mt-2 font-serif text-lg text-hek-ink">Contact &amp; delivery</h3>
        <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true }]}>
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item name="phone" label="Phone" rules={[{ required: true, whitespace: true }]}>
          <Input size="large" autoComplete="tel" />
        </Form.Item>
        <Form.Item
          name="deliveryAddress"
          label="Delivery address"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input.TextArea rows={3} autoComplete="street-address" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Submit request
        </Button>
      </Form>
    </div>
  );
}
