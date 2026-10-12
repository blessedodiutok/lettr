"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { useCreateReview } from "../../hooks/useAccount";
import { errorMessage } from "../../lib/api";
import { cn } from "../../lib/cn";
import { FormError } from "../auth/AuthHeading";
import { Button } from "../ui/button";
import { Field, Input, Textarea } from "../ui/field";

export function ReviewForm({ listingId, reviewee }: { listingId: string; reviewee: { id: string; firstName: string } }) {
  const create = useCreateReview();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (create.isSuccess) return <p className="text-sm font-semibold text-ok">Thanks — your review of {reviewee.firstName} is published.</p>;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({ listingId, revieweeId: reviewee.id, rating, title, body });
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} className="p-0.5">
              <Star className={cn("size-7", n <= rating ? "fill-[var(--brass)] text-brass" : "text-line-strong")} />
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Headline">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Responsive and fair" />
      </Field>
      <Field label="Your review" hint="At least 20 characters. Shown publicly with your first name.">
        <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} />
      </Field>
      <FormError message={create.isError ? errorMessage(create.error) : null} />
      <div>
        <Button type="submit" disabled={!rating || title.trim().length < 5 || body.trim().length < 20} isLoading={create.isPending}>
          Publish review
        </Button>
      </div>
    </form>
  );
}
