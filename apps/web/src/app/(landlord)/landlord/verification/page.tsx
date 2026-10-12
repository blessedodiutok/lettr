"use client";

import { VERIFICATION_DOCUMENT_TYPES } from "@lettr/types";
import { formatDate } from "@lettr/utils";
import { FileUp, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, PageHeader, Skeleton, StatusPill } from "../../../../components/ui/display";
import { Field, Input, Select } from "../../../../components/ui/field";
import { useMyDocuments, useUploadDocument } from "../../../../hooks/useAccount";
import { useRefreshMe } from "../../../../hooks/useRefreshMe";
import { useAuthStore } from "../../../../stores/authStore";
import { toast } from "../../../../stores/toastStore";

const LABELS = Object.fromEntries(VERIFICATION_DOCUMENT_TYPES.map((d) => [d.value, d.label]));

export default function VerificationPage() {
  const profile = useAuthStore((s) => s.user?.landlordProfile);
  const documents = useMyDocuments();
  const upload = useUploadDocument();
  const refreshMe = useRefreshMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("NIN");
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const status = profile?.verificationStatus ?? "UNVERIFIED";

  return (
    <>
      <PageHeader title="Verification" description="Tenants trust landlords who've proven who they are. Verify once and every listing shows the badge." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-5">
          <Card className="flex items-start gap-4">
            <ShieldCheck className={status === "VERIFIED" ? "size-8 shrink-0 text-ok" : "size-8 shrink-0 text-muted"} aria-hidden />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-ink">Your status</h2>
                <StatusPill kind="verification" status={status} />
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {status === "VERIFIED" && "You're verified. The ID-verified badge shows on all your listings."}
                {status === "PENDING_REVIEW" && "We're reviewing your document, usually within one working day. You can publish listings meanwhile."}
                {status === "UNVERIFIED" && "Upload a government ID to publish listings and earn the verified badge."}
                {status === "REJECTED" && (profile?.rejectionReason ?? "Your last document was rejected. Please upload a clearer one.")}
              </p>
            </div>
          </Card>

          {status !== "VERIFIED" && (
            <Card>
              <h2 className="font-semibold text-ink">Upload a document</h2>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!file) return;
                  upload.mutate(
                    { file, documentType: type, documentNumber: number.trim() || undefined },
                    {
                      onSuccess: async () => {
                        setFile(null);
                        setNumber("");
                        await refreshMe();
                      },
                    },
                  );
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Document type">
                    <Select value={type} onChange={(e) => setType(e.target.value)}>
                      {VERIFICATION_DOCUMENT_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Document number" optional>
                    <Input value={number} onChange={(e) => setNumber(e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-card border border-dashed border-line-strong bg-bg p-4">
                  <FileUp className="size-6 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-ink">{file ? file.name : "A clear photo or scan, all four corners visible"}</p>
                    <p className="text-muted">JPG, PNG, WebP or PDF · up to 5 MB</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const chosen = e.target.files?.[0] ?? null;
                      if (chosen && chosen.size > 5 * 1024 * 1024) {
                        toast.error("That file is larger than 5 MB.");
                        return;
                      }
                      setFile(chosen);
                    }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                    Choose file
                  </Button>
                </div>
                <div>
                  <Button type="submit" disabled={!file} isLoading={upload.isPending}>
                    Submit for review
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold text-ink">Submitted documents</h2>
            {documents.isPending ? (
              <Skeleton className="mt-3 h-16" />
            ) : !documents.data?.length ? (
              <p className="mt-2 text-sm text-muted">Nothing submitted yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {documents.data.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{LABELS[d.documentType] ?? d.documentType}</p>
                      <p className="text-muted">Submitted {formatDate(d.createdAt)}</p>
                      {d.rejectionReason && <p className="text-bad">{d.rejectionReason}</p>}
                    </div>
                    <StatusPill kind="verification" status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <aside>
          <Card>
            <h2 className="font-semibold text-ink">How we handle your ID</h2>
            <p className="mt-2 text-sm text-ink-2">
              Documents are stored privately. Only Lettr&apos;s verification team can open them, through links that expire after 10 minutes, and every view is logged. Tenants never see your document — only the badge.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
