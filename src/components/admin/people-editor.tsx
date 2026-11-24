"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Toggle } from "./editor-kit";
import { Panel } from "./ui";
import { useRun } from "./product-row-actions";
import { deleteCertification, deleteTestimonial, saveCertification, saveTestimonial } from "@/app/admin/actions/site";

type Cert = { id?: string; name: string; issuer: string; status: "done" | "in_progress" | "planned"; progress: number; date: string; url: string };
type Quote = { id?: string; quote: string; name: string; role: string; visible: boolean };

export function PeopleEditor({ certs: initialCerts, quotes: initialQuotes }: { certs: Cert[]; quotes: Quote[] }) {
  const [certs, setCerts] = useState(initialCerts);
  const [quotes, setQuotes] = useState(initialQuotes);
  const { run, pending } = useRun();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="Certifications & courses"
        action={
          <Button size="sm" variant="outline" onClick={() => setCerts([...certs, { name: "", issuer: "", status: "in_progress", progress: 0, date: String(new Date().getFullYear()), url: "" }])}>
            <Plus aria-hidden /> Add
          </Button>
        }
      >
        <p className="mb-4 text-[0.8125rem] text-muted">Shown honestly on the About page: earned, in progress (with a progress bar) or planned.</p>
        <ul className="space-y-4">
          {certs.map((c, i) => {
            const upd = (patch: Partial<Cert>) => setCerts(certs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <li key={c.id ?? `new-${i}`} className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" htmlFor={`c-n-${i}`}>
                    <Input id={`c-n-${i}`} value={c.name} onChange={(e) => upd({ name: e.target.value })} placeholder="CompTIA Security+" />
                  </Field>
                  <Field label="Issuer" htmlFor={`c-i-${i}`}>
                    <Input id={`c-i-${i}`} value={c.issuer} onChange={(e) => upd({ issuer: e.target.value })} />
                  </Field>
                  <Field label="Status" htmlFor={`c-s-${i}`}>
                    <Select id={`c-s-${i}`} value={c.status} onChange={(e) => upd({ status: e.target.value as Cert["status"] })}>
                      <option value="done">Earned</option>
                      <option value="in_progress">In progress</option>
                      <option value="planned">Planned</option>
                    </Select>
                  </Field>
                  <Field label={c.status === "in_progress" ? `Progress (${c.progress}%)` : "Date"} htmlFor={`c-p-${i}`}>
                    {c.status === "in_progress" ? (
                      <input id={`c-p-${i}`} type="range" min={0} max={100} step={5} value={c.progress} onChange={(e) => upd({ progress: Number(e.target.value) })} className="h-10 w-full accent-[var(--accent-text)]" />
                    ) : (
                      <Input id={`c-p-${i}`} value={c.date} onChange={(e) => upd({ date: e.target.value })} placeholder="2026" />
                    )}
                  </Field>
                </div>
                <Field label="Credential URL (optional)" htmlFor={`c-u-${i}`}>
                  <Input id={`c-u-${i}`} type="url" value={c.url} onChange={(e) => upd({ url: e.target.value })} />
                </Field>
                <div className="flex justify-between">
                  <Button size="sm" disabled={pending} onClick={() => run(() => saveCertification({ ...c, url: c.url || null, order: i }), (d) => d && upd({ id: d.id }))}>
                    <Save aria-hidden /> Save
                  </Button>
                  <button
                    type="button"
                    className={buttonClass({ variant: "ghost", size: "sm" }, "text-danger")}
                    onClick={() => (c.id ? confirm("Remove this certification?") && run(() => deleteCertification(c.id!), () => setCerts(certs.filter((_, j) => j !== i))) : setCerts(certs.filter((_, j) => j !== i)))}
                  >
                    <Trash2 aria-hidden /> Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel
        title="Client quotes"
        action={
          <Button size="sm" variant="outline" onClick={() => setQuotes([...quotes, { quote: "", name: "", role: "", visible: false }])}>
            <Plus aria-hidden /> Add
          </Button>
        }
      >
        <p className="mb-4 text-[0.8125rem] text-muted">Real quotes only. The Proof section stays hidden until at least one quote is visible or you add numbers.</p>
        <ul className="space-y-4">
          {quotes.map((q, i) => {
            const upd = (patch: Partial<Quote>) => setQuotes(quotes.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <li key={q.id ?? `new-${i}`} className="space-y-3 rounded-lg border border-border p-4">
                <Field label="Quote" htmlFor={`q-q-${i}`}>
                  <Textarea id={`q-q-${i}`} rows={3} value={q.quote} onChange={(e) => upd({ quote: e.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" htmlFor={`q-n-${i}`}>
                    <Input id={`q-n-${i}`} value={q.name} onChange={(e) => upd({ name: e.target.value })} />
                  </Field>
                  <Field label="Role, company" htmlFor={`q-r-${i}`}>
                    <Input id={`q-r-${i}`} value={q.role} onChange={(e) => upd({ role: e.target.value })} />
                  </Field>
                </div>
                <Toggle checked={q.visible} onChange={(x) => upd({ visible: x })} label="Visible on the site" />
                <div className="flex justify-between">
                  <Button size="sm" disabled={pending} onClick={() => run(() => saveTestimonial({ ...q, order: i }), (d) => d && upd({ id: d.id }))}>
                    <Save aria-hidden /> Save
                  </Button>
                  <button
                    type="button"
                    className={buttonClass({ variant: "ghost", size: "sm" }, "text-danger")}
                    onClick={() => (q.id ? confirm("Remove this quote?") && run(() => deleteTestimonial(q.id!), () => setQuotes(quotes.filter((_, j) => j !== i))) : setQuotes(quotes.filter((_, j) => j !== i)))}
                  >
                    <Trash2 aria-hidden /> Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
