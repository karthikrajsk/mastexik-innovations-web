import { CodesUtil } from "./codesUtil";

export function getTradeTypeId(type: "DOMESTIC" | "INTERNATIONAL"): number | null {
  try {
    // First, try to get from CodesUtil in-memory store
    let headers = CodesUtil.getHeaders();
    
    // If empty, try to load from localStorage directly
    if (!headers || headers.length === 0) {
      const stored = localStorage.getItem("codes_header");
      if (stored) {
        headers = JSON.parse(stored);
      }
    }
    
    if (!headers || headers.length === 0) {
      return null;
    }

    const hdr = headers.find((h: any) => h.code_group === "TRADE_TYPE" || h.codeGroup === "TRADE_TYPE");
    
    if (!hdr) {
      return null;
    }

    const detail = hdr.details?.find((d: any) => d.code === type);
    return detail?.id ?? null;
  } catch (error) {
    console.error("Error getting trade type ID:", error);
    return null;
  }
}
