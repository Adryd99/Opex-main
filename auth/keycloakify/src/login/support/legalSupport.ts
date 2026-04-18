export type LegalDocumentSlug = "privacy" | "terms" | "cookies";

export type LegalSection = {
    title: string;
    bullets: string[];
};

export type LegalDocumentPayload = {
    slug: LegalDocumentSlug;
    title: string;
    version: string;
    lastUpdated: string;
    summary: string;
    sections: LegalSection[];
};

export type LegalPublicInfoPayload = {
    privacyPolicy?: Omit<LegalDocumentPayload, "slug">;
    termsOfService?: Omit<LegalDocumentPayload, "slug">;
    cookiePolicy?: Omit<LegalDocumentPayload, "slug">;
};

export const resolveLegalDocument = (
    payload: LegalPublicInfoPayload | null,
    slug: LegalDocumentSlug
): LegalDocumentPayload | null => {
    if (!payload) {
        return null;
    }

    switch (slug) {
        case "privacy":
            return payload.privacyPolicy ? { slug, ...payload.privacyPolicy } : null;
        case "terms":
            return payload.termsOfService ? { slug, ...payload.termsOfService } : null;
        case "cookies":
            return payload.cookiePolicy ? { slug, ...payload.cookiePolicy } : null;
        default:
            return null;
    }
};
