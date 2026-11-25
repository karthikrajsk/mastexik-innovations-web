import React from "react";
import { ColumnFormData } from "@/state/reportConfigSlice";
import { Trash2, Edit } from "lucide-react";

interface ScreenColor {
  bg: string;
  text: string;
  border: string;
  lightBg: string;
  darkBg: string;
}

interface ReportConfigTableProps {
  columns: ColumnFormData[];
  onRemove: (id: string | undefined) => void;
  onEdit: (id: string | undefined) => void;
  formErrors: Record<string, string>;
  screenColors: Record<string, ScreenColor>;
  selectedScreen: string;
}

const getScreenColor = (screenName: string, screenColors: Record<string, ScreenColor>): ScreenColor => {
  return screenColors[screenName] || {
    bg: "bg-gray-500",
    text: "text-gray-800",
    border: "border-gray-300",
    lightBg: "bg-gray-50",
    darkBg: "bg-gray-100"
  };
};

export function ReportConfigurationTable({
  columns,
  onRemove,
  onEdit,
  formErrors,
  screenColors,
  selectedScreen,
}: ReportConfigTableProps) {
  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No columns configured yet.
      </div>
    );
  }

  const dominantScreenColor = getScreenColor(selectedScreen, screenColors);

  return (
    <div className={`overflow-x-auto border-2 rounded-lg ${dominantScreenColor.border}`}>
      <table className="w-full text-sm">
        <thead className={`${dominantScreenColor.darkBg} border-b-2 ${dominantScreenColor.border}`}>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">S.No</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Column Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Screen Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Section Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Field Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Formula</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Filter</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column, idx) => {
            const screenColor = getScreenColor(column.screenName, screenColors);
            return (
              <tr
                key={column.id}
                className={`border-b ${idx % 2 === 0 ? dominantScreenColor.lightBg : 'bg-white'} hover:${dominantScreenColor.darkBg} transition-colors`}
              >
                <td className="px-4 py-3 font-medium">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{column.columnName}</td>
                <td className="px-4 py-3">
                  {column.screenName && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${screenColor.bg} text-white`}>
                      {column.screenName}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{column.sectionName}</td>
                <td className="px-4 py-3 text-gray-700">
                  {column.isFormulaApplied ? (
                    <span className="text-xs text-gray-500 italic">Formula Based</span>
                  ) : (
                    column.fieldName
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {column.isFormulaApplied ? (
                      <>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Yes
                        </span>
                        {column.formulaType && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {column.formulaType}
                          </span>
                        )}
                        {column.formulaBar && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono truncate max-w-xs">
                            {column.formulaBar}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        No
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {column.isFilterRequired ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        Yes
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {column.filterType}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(column.id)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 dark:hover:bg-blue-900 transition-colors"
                      title="Edit column"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(column.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 dark:hover:bg-red-900 transition-colors"
                      title="Delete column"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ReportConfigurationTable;