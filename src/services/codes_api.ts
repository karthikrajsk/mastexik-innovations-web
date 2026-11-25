// services/codes_api.ts
import apiService from "@/services/ApiService";
import { CodeDetail, CodeHeader } from "@/types/codes";

export const CodesAPI = {

  getCodeDetailsByHeader(header: string): Promise<CodeDetail[]> {
    return apiService.get("/codes_details", { hdr: header });
  },
  getCodesHeader(limit = 1000): Promise<CodeHeader[]> {
    return apiService.get("/codes-header", { limit });
  },

};
