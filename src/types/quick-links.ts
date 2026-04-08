import { TZDate } from "react-day-picker";
import { z } from "zod";

export const baseQuickLinkSchema = z.object({
  label: z.string().min(1, "Label cannot be empty"),
  link: z.string().url("Invalid URL"),
});

export const quickLinkInputSchema = baseQuickLinkSchema;

export const quickLinkOutputSchema = baseQuickLinkSchema.extend({
  id: z.string().uuid(),
  createdById: z.string().uuid(),
  createdAt: z.union([
    z.date(),
    z.string().transform((date) => new TZDate(date)),
  ]),
  updatedAt: z
    .union([z.date(), z.string().transform((date) => new TZDate(date))])
    .nullable(),
});

export const quickLinkFormSchema = baseQuickLinkSchema;

export type QuickLinkInput = z.infer<typeof quickLinkInputSchema>;
export type QuickLinkOutput = z.infer<typeof quickLinkOutputSchema>;
export type QuickLinkFormValues = z.infer<typeof quickLinkFormSchema>;
