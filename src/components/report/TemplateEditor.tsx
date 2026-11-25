import React, { useState } from "react";
import { TemplateField, ReportTemplate } from "@/state/reportConfigSlice";
import {
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";

interface TemplateEditorProps {
  template: ReportTemplate;
  onUpdateTemplate: (template: ReportTemplate) => void;
  screenColors: Record<string, any>;
  selectedScreen: string;
}

const getFieldInputType = (fieldType?: string): string => {
  switch (fieldType) {
    case "date":
      return "date";
    case "number":
      return "number";
    case "select":
      return "text";
    default:
      return "text";
  }
};

const FieldTypeBadge = ({ type }: { type?: string }) => {
  const typeStyles: Record<string, string> = {
    text: "bg-blue-100 text-blue-800",
    number: "bg-green-100 text-green-800",
    date: "bg-purple-100 text-purple-800",
    select: "bg-orange-100 text-orange-800",
  };

  const style = typeStyles[type || "text"] || typeStyles.text;
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${style}`}>
      {type || "text"}
    </span>
  );
};

export function TemplateEditor({
  template,
  onUpdateTemplate,
  screenColors,
  selectedScreen,
}: TemplateEditorProps) {
  const screenColor = screenColors[selectedScreen] || {
    bg: "bg-gray-500",
    text: "text-gray-800",
    border: "border-gray-300",
    lightBg: "bg-gray-50",
    darkBg: "bg-gray-100",
  };

  const handleFieldValueChange = (fieldId: string, value: any) => {
    const field = template.templateFields.find((f: TemplateField) => f.id === fieldId);
    if (field) {
      const updatedFields = template.templateFields.map((f: TemplateField) =>
        f.id === fieldId ? { ...f, dataValue: value } : f
      );
      onUpdateTemplate({ ...template, templateFields: updatedFields });
    }
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = template.templateFields
      .filter((f: TemplateField) => f.id !== fieldId)
      .map((f: TemplateField, idx) => ({ ...f, order: idx }));
    onUpdateTemplate({ ...template, templateFields: updatedFields });
  };

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const index = template.templateFields.findIndex((f: TemplateField) => f.id === fieldId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const newFields = [...template.templateFields];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      onUpdateTemplate({
        ...template,
        templateFields: newFields.map((f: TemplateField, idx) => ({ ...f, order: idx })),
      });
    } else if (direction === "down" && index < template.templateFields.length - 1) {
      const newFields = [...template.templateFields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      onUpdateTemplate({
        ...template,
        templateFields: newFields.map((f: TemplateField, idx) => ({ ...f, order: idx })),
      });
    }
  };

  if (template.templateFields.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600">No template fields yet. Generate template from report configuration.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto border-2 rounded-lg ${screenColor.border}`}>
      <table className="w-full text-sm">
        <thead className={`${screenColor.darkBg} border-b-2 ${screenColor.border}`}>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 w-12">S.No</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Column Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Screen</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Field Label</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {template.templateFields.map((field: TemplateField, idx) => (
            <tr
              key={field.id}
              className={`border-b ${
                idx % 2 === 0 ? screenColor.lightBg : "bg-white"
              } hover:${screenColor.darkBg} transition-colors`}
            >
              <td className="px-4 py-3 font-medium text-center">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {field.columnName}
                {field.isFormula && (
                  <div className="text-xs text-green-600 mt-1">
                    Formula: {field.formulaType}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${screenColor.bg} text-white`}>
                  {field.screenName}
                </span>
              </td>
              <td className="px-4 py-3">
                <FieldTypeBadge type={field.fieldType} />
              </td>
              <td className="px-4 py-3 text-gray-700">
                {field.fieldLabel}
              </td>
              <td className="px-4 py-3">
                {field.isFormula ? (
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                    <p className="font-mono break-all">{field.formulaBar}</p>
                  </div>
                ) : (
                  <input
                    type={getFieldInputType(field.fieldType)}
                    value={field.dataValue || ""}
                    onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${field.fieldLabel || field.fieldName}`}
                  />
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveField(field.id, "up")}
                    disabled={idx === 0}
                    className="p-1.5 hover:bg-blue-100 rounded text-blue-600 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveField(field.id, "down")}
                    disabled={idx === template.templateFields.length - 1}
                    className="p-1.5 hover:bg-blue-100 rounded text-blue-600 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                    title="Delete field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TemplateEditor;