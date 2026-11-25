import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyContext {
    companyId: number | null;
    companyName: string;
}

const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) {
        return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

const safeParse = (raw: string | null) => {
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const assignFromCompany = (target: { companyId: number | null; companyName: string }, source: any) => {
    if (!source || typeof source !== "object") {
        return;
    }
    const id = toNumber((source as any).id);
    if (id !== null) {
        target.companyId = id;
    }
    if (!target.companyName && typeof (source as any).name === "string") {
        target.companyName = (source as any).name;
    }
};

export const getCompanyContext = (): CompanyContext => {
    if (typeof window === "undefined" || !window.localStorage) {
        return { companyId: null, companyName: "" };
    }

    const context: CompanyContext = { companyId: null, companyName: "" };

    const companyIdStr = window.localStorage.getItem("companyId");
    const parsedId = toNumber(companyIdStr);
    if (parsedId !== null) {
        context.companyId = parsedId;
    }

    const selectedCompany = safeParse(window.localStorage.getItem("selectedCompany"));
    assignFromCompany(context, selectedCompany);

    const authPayload = safeParse(window.localStorage.getItem("authPayload"));
    const authCompanies = authPayload?.user?.companies || authPayload?.companies;
    if (Array.isArray(authCompanies) && authCompanies.length) {
        const match = context.companyId !== null
            ? authCompanies.find((c: any) => toNumber(c?.id) === context.companyId)
            : authCompanies[0];
        assignFromCompany(context, match);
    }

    const user = safeParse(window.localStorage.getItem("user"));
    if (Array.isArray(user?.companies) && user.companies.length) {
        const match = context.companyId !== null
            ? user.companies.find((c: any) => toNumber(c?.id) === context.companyId)
            : user.companies[0];
        assignFromCompany(context, match);
    }

    const companies = safeParse(window.localStorage.getItem("companies"));
    if (Array.isArray(companies) && companies.length) {
        const match = context.companyId !== null
            ? companies.find((c: any) => toNumber(c?.id) === context.companyId)
            : companies[0];
        assignFromCompany(context, match);
    }

    return context;
};

export const resolveCompanyId = (): number | null => {
    const context = getCompanyContext();
    if (context.companyId !== null) {
        return context.companyId;
    }
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    const fallback = window.localStorage.getItem("selectedCompanyId") ?? window.localStorage.getItem("selectedCompany");
    if (!fallback) {
        return null;
    }
    const parsed = Number(fallback);
    return Number.isNaN(parsed) ? null : parsed;
};

export const useCompanyContext = (): CompanyContext => {
    const [context, setContext] = useState<CompanyContext>({ companyId: null, companyName: "" });

    useEffect(() => {
        setContext(getCompanyContext());
    }, []);

    return context;
};

/**
 * Returns the currently selected/logged-in company's ID as a live React value.
 * Uses useAuth's selectedCompany (real-time state) as the primary source,
 * with localStorage selectedCompanyId/selectedCompany as fallback.
 * Use this instead of companyId from useCompanyContext() to avoid stale values
 * when a user switches between companies.
 */
export const useResolvedCompanyId = (): number | undefined => {
    const { selectedCompany } = useAuth();
    return useMemo(() => {
        if (selectedCompany != null && !Number.isNaN(Number(selectedCompany))) {
            return Number(selectedCompany);
        }
        const stored =
            window.localStorage.getItem("selectedCompanyId") ||
            window.localStorage.getItem("selectedCompany");
        if (!stored) return undefined;
        const parsed = Number(stored);
        return Number.isNaN(parsed) ? undefined : parsed;
    }, [selectedCompany]);
};
