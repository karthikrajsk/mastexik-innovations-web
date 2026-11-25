export interface CodeDetail {
  id: number;
  code: string;
  value: string;
  is_active?: boolean;
}

export interface CodeHeader {
  id: number;
  hdr_id?: number;
  hdrId?: number;
  code_group?: string;
  codeGroup?: string;
  is_active?: boolean;
  isActive?: boolean;
  details: CodeDetail[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
