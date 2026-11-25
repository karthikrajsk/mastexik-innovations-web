import { useMemo } from "react";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";

export interface YarnWarehouseOption {
  id: number;
  value: string;
  label: string;
  activeFlag: boolean;
}

const extractWarehouseList = (warehouseList: any): any[] => {
  if (Array.isArray(warehouseList)) return warehouseList;
  if (Array.isArray(warehouseList?.data)) return warehouseList.data;
  if (Array.isArray(warehouseList?.data?.data)) return warehouseList.data.data;
  return [];
};

export function useYarnWarehouseOptions(warehouseList: any): {
  yarnWarehouseOptions: YarnWarehouseOption[];
  defaultYarnWarehouseId: string;
} {
  const companyId = useResolvedCompanyId();

  const filtered = useMemo(() => {
    const list = extractWarehouseList(warehouseList);
    return list.filter((w: any) => {
      if (w.activeFlag === false) return false;
      if (w.warehouseType !== "Yarn") return false;
      if (w.ownerType === "Company" && companyId && Number(w.ownerId) !== companyId) return false;
      return true;
    });
  }, [warehouseList, companyId]);

  const yarnWarehouseOptions = useMemo<YarnWarehouseOption[]>(
    () =>
      filtered.map((w: any) => ({
        id: w.id,
        value: String(w.id),
        label: w.warehouseName || w.name || String(w.id),
        activeFlag: w.activeFlag ?? true,
      })),
    [filtered]
  );

  const defaultYarnWarehouseId = useMemo(() => {
    const companyDefault = filtered.find(
      (w: any) => w.ownerType === "Company" && w.isDefault === true
    );
    if (companyDefault) return String(companyDefault.id);

    const anyDefault = filtered.find((w: any) => w.isDefault === true);
    if (anyDefault) return String(anyDefault.id);

    return filtered.length > 0 ? String(filtered[0].id) : "";
  }, [filtered]);

  return { yarnWarehouseOptions, defaultYarnWarehouseId };
}
