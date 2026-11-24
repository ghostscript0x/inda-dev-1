"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  Section,
  Toggle,
  useSaveShortcut,
  useUnsavedWarning,
} from "./editor-kit";
import { FilePicker, type MediaRef } from "./uploader";
import { useRun } from "./product-row-actions";
import { saveSettings } from "@/app/admin/actions/site";
import { NETWORK_INFO, type Social } from "@/lib/content";

type Value = {
  name: string;
  tagline: string;
  bio: string;
  email: string;
  whatsapp: string;
  bookingUrl: string;
  availability: boolean;
  availabilityText: string;
  socials: Social[];
  cv: MediaRef | null;
};

const NETWORKS: Social["network"][] = [
  "github",
  "linkedin",
  "x",
  "tiktok",
  "whatsapp",
  "email",
  "youtube",
  "instagram",
  "devto",
];

export function SettingsForm({ initial }: { initial: Value }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const { run, pending } = useRun();
  const dirty = JSON.stringify(v) !== saved;
  const set = <K extends keyof Value>(k: K, val: Value[K]) =>
    setV((p) => ({ ...p, [k]: val }));
  useUnsavedWarning(dirty);

  const save = () =>
    run(
      () => saveSettings({ ...v, cvFileId: v.cv?.id ?? null }),
      () => setSaved(JSON.stringify(v)),
    );
  useSaveShortcut(save);

  const moveSocial = (i: number, d: number) => {
    const next = [...v.socials];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it);
    set("socials", next);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Section title="Identity">
        <Field label="Name" htmlFor="s-name">
          <Input
            id="s-name"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Tagline" htmlFor="s-tag">
          <Input
            id="s-tag"
            value={v.tagline}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </Field>
        <Field label="One-line bio (footer)" htmlFor="s-bio">
          <Textarea
            id="s-bio"
            rows={2}
            value={v.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Availability">
        <Toggle
          checked={v.availability}
          onChange={(x) => set("availability", x)}
          label="Show status pill in the hero"
        />
        <Field label="Status text" htmlFor="s-av">
          <Input
            id="s-av"
            value={v.availabilityText}
            onChange={(e) => set("availabilityText", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="s-email">
            <Input
              id="s-email"
              type="email"
              value={v.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label="WhatsApp number"
            htmlFor="s-wa"
            hint="International format, e.g. +2348012345678"
          >
            <Input
              id="s-wa"
              value={v.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Booking link (Cal.com)" htmlFor="s-book">
          <Input
            id="s-book"
            type="url"
            value={v.bookingUrl}
            onChange={(e) => set("bookingUrl", e.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Social links"
        description="Shown in the hero, the left rail and the footer, in this order. Just paste your profile link."
      >
        <ul className="space-y-2">
          {v.socials.map((s, i) => {
            const derived = s.network === "email" || s.network === "whatsapp";
            const update = (patch: Partial<Social>) =>
              set(
                "socials",
                v.socials.map((x, j) => (j === i ? { ...x, ...patch } : x)),
              );
            return (
              <li
                key={i}
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"
              >
                <Select
                  aria-label="Network"
                  value={s.network}
                  onChange={(e) => {
                    const network = e.target.value as Social["network"];
                    update({
                      network,
                      label: NETWORK_INFO[network].label,
                      href:
                        network === "email" || network === "whatsapp"
                          ? ""
                          : s.href,
                    });
                  }}
                >
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {NETWORK_INFO[n].label}
                    </option>
                  ))}
                </Select>
                {derived ? (
                  <p className="flex h-10 items-center truncate px-1 text-[0.8125rem] text-subtle">
                    {s.network === "email"
                      ? v.email
                        ? `Uses ${v.email}`
                        : "Add your email above"
                      : v.whatsapp.replace(/\D/g, "").length >= 8
                        ? `Uses ${v.whatsapp}`
                        : "Add your WhatsApp number above"}
                  </p>
                ) : (
                  <Input
                    aria-label={`${NETWORK_INFO[s.network].label} link`}
                    type="url"
                    value={s.href}
                    placeholder={NETWORK_INFO[s.network].placeholder}
                    onChange={(e) => update({ href: e.target.value.trim() })}
                  />
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveSocial(i, -1)}
                    className={buttonClass({ variant: "ghost", size: "icon" })}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    type="button"
                    disabled={i === v.socials.length - 1}
                    onClick={() => moveSocial(i, 1)}
                    className={buttonClass({ variant: "ghost", size: "icon" })}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "socials",
                        v.socials.filter((_, j) => j !== i),
                      )
                    }
                    className={buttonClass(
                      { variant: "ghost", size: "icon" },
                      "text-danger",
                    )}
                    aria-label="Remove link"
                  >
                    <Trash2 />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {v.socials.length < NETWORKS.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = NETWORKS.find(
                (n) => !v.socials.some((s) => s.network === n),
              )!;
              set("socials", [
                ...v.socials,
                { network: next, label: NETWORK_INFO[next].label, href: "" },
              ]);
            }}
          >
            <Plus aria-hidden /> Add link
          </Button>
        )}
      </Section>

      <Section title="CV" description="PDF offered on the About page.">
        <FilePicker value={v.cv} onChange={(m) => set("cv", m)} />
        {v.cv && (
          <button
            type="button"
            className="text-14 text-danger"
            onClick={() => set("cv", null)}
          >
            Remove CV
          </button>
        )}
      </Section>

      <div className="sticky bottom-20 flex items-center justify-end gap-3 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur md:bottom-4">
        <span className="text-[0.75rem] text-subtle">
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
        <Button onClick={save} disabled={pending || !dirty}>
          <Save aria-hidden /> Save settings
        </Button>
      </div>
    </div>
  );
}
