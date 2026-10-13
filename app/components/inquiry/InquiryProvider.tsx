import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Inquiry } from "~/content/types";
import { parseInquiryLink } from "./deepLink";

type InquiryState = {
  isOpen: boolean;
  prefill: Partial<Inquiry>;
  /** Changes on every open so the drawer form re-initialises from the new prefill. */
  openCount: number;
};

type InquiryContextValue = InquiryState & {
  openInquiry: (prefill?: Partial<Inquiry>) => void;
  close: () => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InquiryState>({ isOpen: false, prefill: {}, openCount: 0 });

  const openInquiry = useCallback((prefill: Partial<Inquiry> = {}) => {
    setState((s) => ({ isOpen: true, prefill, openCount: s.openCount + 1 }));
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);

  useEffect(() => {
    const prefill = parseInquiryLink(window.location.search);
    if (prefill) openInquiry(prefill);
  }, [openInquiry]);

  const value = useMemo(() => ({ ...state, openInquiry, close }), [state, openInquiry, close]);
  return <InquiryContext value={value}>{children}</InquiryContext>;
}

export function useInquiry(): InquiryContextValue {
  const value = useContext(InquiryContext);
  if (!value) throw new Error("useInquiry must be used inside <InquiryProvider>");
  return value;
}
