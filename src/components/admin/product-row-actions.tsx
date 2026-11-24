"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Eye, EyeOff, FileUp, Pencil, Rocket, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Menu, MenuItem, MenuSeparator } from "./menu";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { deleteProduct, duplicateProduct, setProductStatus, updatePrice } from "@/app/admin/actions/products";
import type { ActionResult } from "@/app/admin/actions/common";

export function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function run<T>(fn: () => Promise<ActionResult<T>>, after?: (data?: T) => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      if (res.message) toast.success(res.message);
      after?.(res.data);
      router.refresh();
    });
  }
  return { run, pending };
}

export function ProductRowActions({ id, slug, status, priceNGN }: { id: string; slug: string; status: string; priceNGN: number }) {
  const router = useRouter();
  const { run, pending } = useRun();
  const [priceOpen, setPriceOpen] = useState(false);
  const [ngn, setNgn] = useState(String(priceNGN));

  return (
    <>
      <Menu label="Product actions">
        {(close) => (
          <>
            <MenuItem href={`/admin/products/${id}`}>
              <Pencil /> Edit
            </MenuItem>
            <MenuItem href={`/api/draft?path=/products/${slug}`} external>
              <Eye /> Preview
            </MenuItem>
            {status !== "published" ? (
              <MenuItem onSelect={() => (close(), run(() => setProductStatus(id, "published")))}>
                <Rocket /> Publish
              </MenuItem>
            ) : (
              <MenuItem onSelect={() => (close(), run(() => setProductStatus(id, "hidden")))}>
                <EyeOff /> Hide
              </MenuItem>
            )}
            <MenuItem onSelect={() => (close(), setPriceOpen(true))}>
              <Tag /> Change price
            </MenuItem>
            <MenuItem href={`/admin/products/${id}#file`}>
              <FileUp /> Replace file
            </MenuItem>
            <MenuItem onSelect={() => (close(), run(() => duplicateProduct(id), (d) => d && router.push(`/admin/products/${d.id}`)))}>
              <Copy /> Duplicate
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              danger
              onSelect={() => {
                close();
                if (confirm("Delete this product? This can’t be undone.")) run(() => deleteProduct(id));
              }}
            >
              <Trash2 /> Delete
            </MenuItem>
          </>
        )}
      </Menu>
      <Dialog.Root open={priceOpen} onOpenChange={setPriceOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border-strong bg-surface p-6 text-left">
            <Dialog.Title className="font-semibold">Change price</Dialog.Title>
            <Dialog.Description className="mt-1 text-14 text-muted">In naira. Set it to 0 to make the product free.</Dialog.Description>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => updatePrice(id, Number(ngn)), () => setPriceOpen(false));
              }}
            >
              <Field label="Price (₦)" htmlFor={`ngn-${id}`}>
                <Input id={`ngn-${id}`} inputMode="decimal" value={ngn} onChange={(e) => setNgn(e.target.value.replace(/[^\d.]/g, ""))} className="font-mono" autoFocus />
              </Field>
              <Button type="submit" disabled={pending} className="w-full">
                Save price
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
