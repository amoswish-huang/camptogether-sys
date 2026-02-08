const parseAdminEmails = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return raw
        .split(',')
        .map(entry => entry.trim().toLowerCase())
        .filter(Boolean);
};

const ADMIN_EMAILS = parseAdminEmails(process.env.ADMIN_EMAILS);

export const isAdminEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    if (ADMIN_EMAILS.length === 0) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};
