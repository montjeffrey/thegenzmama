import * as z from "zod";

// Option values must match the <select> options in contact/ContactClient.tsx.
export const CHILD_COUNTS = ["1", "2", "3+"] as const;
export const SERVICE_TYPES = [
    "General Inquiry",
    "Facility Care (Wharton)",
    "Overnight Newborn Care",
    "Pediatric Sleep Consulting",
    "Travel Nanny",
] as const;

// Maximum lengths bound what a single submission can put in the owner's inbox.
export const contactFormSchema = z.object({
    parentName: z.string().min(2, "Name is required").max(100, "Name is too long"),
    email: z.string().max(254, "Email is too long").email("Invalid email"),
    phone: z.string().min(10, "Phone number is required").max(30, "Phone number is too long"),
    childCount: z.enum(CHILD_COUNTS),
    childAges: z.string().min(1, "Ages are required").max(200, "Ages are too long"),
    // <input type="date"> submits YYYY-MM-DD
    startDate: z.string().min(1, "Start date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
    schedule: z.array(z.string().max(30)).max(7).optional(),
    allergies: z.string().max(1000, "Allergies is too long").optional(),
    message: z.string().max(5000, "Message is too long").optional(),
    serviceType: z.enum(SERVICE_TYPES).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
