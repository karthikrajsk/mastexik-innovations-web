import { CodeHeader } from "@/types/codes";

export class CodesUtil {
  private static isLoaded = false;
  private static codesHeader: CodeHeader[] = [];
  private static readonly STORAGE_KEY = "codes_header";

  static async loadOnce(loader: () => Promise<CodeHeader[]>) {
    if (this.isLoaded) return;

    try {
      const response = await loader();
      const data = Array.isArray(response) ? response : ((response as any).data || []);
      this.codesHeader = data;
      this.isLoaded = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load codes header:", error);
      this.loadFromStorage();
    }
  }

  private static loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.codesHeader = JSON.parse(stored);
        this.isLoaded = true;
      }
    } catch (error) {
      console.error("Failed to load codes from storage:", error);
    }
  }

  static getHeaders(): CodeHeader[] {
    if (!this.isLoaded) {
      this.loadFromStorage();
    }
    return this.codesHeader;
  }

  static clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.codesHeader = [];
    this.isLoaded = false;
  }
}
