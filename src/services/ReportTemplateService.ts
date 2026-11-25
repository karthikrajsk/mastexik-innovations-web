import { ReportConfig, ReportColumn, ReportTemplate, TemplateField } from "@/state/reportConfigSlice";
import { TransactionModuleService, TransactionModuleField } from "./TransactionModuleService";

class ReportTemplateServiceClass {
  private static instance: ReportTemplateServiceClass;
  private constructor() {}

  static getInstance(): ReportTemplateServiceClass {
    if (!ReportTemplateServiceClass.instance) {
      ReportTemplateServiceClass.instance = new ReportTemplateServiceClass();
    }
    return ReportTemplateServiceClass.instance;
  }

  async generateTemplate(reportConfig: ReportConfig): Promise<ReportTemplate> {
    const templateFields: TemplateField[] = [];
    for (let i = 0; i < reportConfig.columns.length; i++) {
      const column = reportConfig.columns[i];
      const field = await this.createTemplateField(column, i);
      templateFields.push(field);
    }
    return {
      reportName: reportConfig.reportName,
      templateFields,
      data: {},
      // Optionals for persistence (empty initially)
      templateContent: undefined,
      queryContent: undefined,
    };
  }

  private async createTemplateField(
    column: ReportColumn,
    order: number
  ): Promise<TemplateField> {
    const fieldLabel = await this.getFieldLabel(
      column.screenName,
      column.sectionName,
      column.fieldName
    );
    const fieldType = await this.getFieldType(
      column.screenName,
      column.sectionName,
      column.fieldName
    );
    return {
      id: `tmpl_${Date.now()}_${order}`,
      columnId: column.id || `col_${order}`,
      columnName: column.columnName,
      screenName: column.screenName,
      sectionName: column.sectionName,
      fieldName: column.fieldName,
      fieldLabel,
      fieldType,
      dataValue: undefined,
      isFormula: column.isFormulaApplied,
      formulaBar: column.formulaBar,
      formulaType: column.formulaType,
      isEditable: true,
      order,
    };
  }

  private async getFieldLabel(
    screenName: string,
    sectionName: string,
    fieldName: string
  ): Promise<string> {
    try {
      const fields = await TransactionModuleService.getFieldsByModuleAndSection(
        screenName,
        sectionName
      );
      const field = fields.find((f) => f.name === fieldName);
      return field?.label || fieldName;
    } catch (error) {
      console.error("Error getting field label:", error);
      return fieldName;
    }
  }

  private async getFieldType(
    screenName: string,
    sectionName: string,
    fieldName: string
  ): Promise<string> {
    try {
      const fields = await TransactionModuleService.getFieldsByModuleAndSection(
        screenName,
        sectionName
      );
      const field = fields.find((f) => f.name === fieldName);
      return field?.type || "text";
    } catch (error) {
      console.error("Error getting field type:", error);
      return "text";
    }
  }

  addTemplateField(
    template: ReportTemplate,
    columnName: string,
    screenName: string,
    sectionName: string,
    fieldName: string,
    isFormula: boolean = false,
    formulaBar: string = "",
    formulaType: string = ""
  ): ReportTemplate {
    const newField: TemplateField = {
      id: `tmpl_${Date.now()}`,
      columnId: `col_${Date.now()}`,
      columnName,
      screenName,
      sectionName,
      fieldName,
      fieldLabel: fieldName,
      fieldType: "text",
      dataValue: undefined,
      isFormula,
      formulaBar,
      formulaType,
      isEditable: true,
      order: template.templateFields.length,
    };
    return {
      ...template,
      templateFields: [...template.templateFields, newField],
    };
  }

  removeTemplateField(
    template: ReportTemplate,
    fieldId: string
  ): ReportTemplate {
    return {
      ...template,
      templateFields: template.templateFields
        .filter((f: TemplateField) => f.id !== fieldId)
        .map((f: TemplateField, idx) => ({ ...f, order: idx })),
    };
  }

  updateTemplateField(
    template: ReportTemplate,
    fieldId: string,
    updates: Partial<TemplateField>
  ): ReportTemplate {
    return {
      ...template,
      templateFields: template.templateFields.map((f: TemplateField) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    };
  }

  updateFieldData(
    template: ReportTemplate,
    fieldId: string,
    dataValue: any
  ): ReportTemplate {
    const updatedTemplate = { ...template };
    updatedTemplate.data = { ...template.data };
    const field = updatedTemplate.templateFields.find((f: TemplateField) => f.id === fieldId);
    if (field) {
      field.dataValue = dataValue;
      updatedTemplate.data[field.columnName] = dataValue;
    }
    return updatedTemplate;
  }

  reorderTemplateFields(
    template: ReportTemplate,
    fieldId: string,
    newOrder: number
  ): ReportTemplate {
    const fields = [...template.templateFields];
    const fieldIndex = fields.findIndex((f: TemplateField) => f.id === fieldId);
    if (fieldIndex === -1 || newOrder < 0 || newOrder >= fields.length) {
      return template;
    }
    const field = fields[fieldIndex];
    fields.splice(fieldIndex, 1);
    fields.splice(newOrder, 0, field);
    return {
      ...template,
      templateFields: fields.map((f: TemplateField, idx) => ({ ...f, order: idx })),
    };
  }

  getTemplateAsData(template: ReportTemplate): Record<string, any> {
    const data: Record<string, any> = {};
    template.templateFields.forEach((field: TemplateField) => {
      data[field.columnName] = field.dataValue || null;
    });
    return data;
  }

  validateTemplate(template: ReportTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (!template.reportName.trim()) {
      errors.push("Report name is required");
    }
    if (template.templateFields.length === 0) {
      errors.push("Template must have at least one field");
    }
    template.templateFields.forEach((field: TemplateField, idx) => {
      if (!field.columnName.trim()) {
        errors.push(`Field ${idx + 1}: Column name is required`);
      }
      if (!field.screenName) {
        errors.push(`Field ${idx + 1}: Screen name is required`);
      }
      if (!field.sectionName) {
        errors.push(`Field ${idx + 1}: Section name is required`);
      }
      if (!field.isFormula && !field.fieldName) {
        errors.push(`Field ${idx + 1}: Field name is required`);
      }
      if (field.isFormula && !field.formulaBar?.trim()) {
        errors.push(`Field ${idx + 1}: Formula is required`);
      }
    });
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const ReportTemplateService = ReportTemplateServiceClass.getInstance();