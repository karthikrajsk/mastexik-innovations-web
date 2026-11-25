import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
import { Search, Plus, Trash2, CheckCircle2, AlertTriangle, FileSpreadsheet, Layers, X, Check, Sparkles } from 'lucide-react';

export interface InspectionEntryItem {
  id?: number;
  fabricInspectionId?: string;
  defectedMeters: string;
  fromMeters: string;
  toMeters: string;
  defectTypeId: string;
  defectPoints: string;
  activeFlag?: boolean;
  [key: string]: any;
}

interface MeterDefectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxMeters?: number;
  inspectionEntries: any[];
  onChangeEntries: (entries: any[]) => void;
  defectTypeOptions: CommonSearchableSelectOption[];
  defectMasterList: any[];
}

/**
 * Utility to parse single numbers, comma/space separated numbers, and ranges (e.g. 10-15)
 */
export const parseMeterNumbers = (input: string, maxMtr: number): number[] => {
  if (!input || !input.trim()) return [];
  const tokens = input.split(/[,;\s]+/);
  const result = new Set<number>();

  for (const token of tokens) {
    const t = token.trim();
    if (!t) continue;

    // Check for range e.g. "10-15" or "10..15"
    if (t.includes('-') || t.includes('..')) {
      const rangeParts = t.split(/-|\.\./);
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0], 10);
        const end = parseInt(rangeParts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxMtr, Math.max(start, end));
          for (let m = min; m <= max; m++) {
            result.add(m);
          }
          continue;
        }
      }
    }

    const num = parseInt(t, 10);
    if (!isNaN(num) && num >= 1 && num <= maxMtr) {
      result.add(num);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
};

export function MeterDefectSheetModal({
  isOpen,
  onClose,
  maxMeters = 500,
  inspectionEntries,
  onChangeEntries,
  defectTypeOptions,
  defectMasterList,
}: MeterDefectSheetModalProps) {
  const totalMetersCount = Math.max(500, Math.ceil(maxMeters || 500));

  // State for quick defect entry toolbar
  const [quickMeter, setQuickMeter] = useState<string>('');
  const [quickDefectTypeId, setQuickDefectTypeId] = useState<string>('');
  const [quickDefectPoints, setQuickDefectPoints] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedColumnRange, setSelectedColumnRange] = useState<number>(0); // 0 = All (1-500), 1 = 1-100, 2 = 101-200, etc.

  // State for continuous multi-defect add popup
  const [isMultiPopupOpen, setIsMultiPopupOpen] = useState<boolean>(false);
  const [popupMeterInput, setPopupMeterInput] = useState<string>('');
  const [popupDefectTypeId, setPopupDefectTypeId] = useState<string>('');
  const [popupDefectPoints, setPopupDefectPoints] = useState<string>('');
  const [keepDefectType, setKeepDefectType] = useState<boolean>(true);
  const [popupStatusMsg, setPopupStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);

  // A meter can have more than one defect type.
  const meterDefectMap = useMemo(() => {
    const map = new Map<number, { entry: InspectionEntryItem; index: number }[]>();
    inspectionEntries.forEach((entry, idx) => {
      const fromM = parseFloat(entry.fromMeters);
      const toM = parseFloat(entry.toMeters);
      const startM = isNaN(fromM) ? 0 : Math.floor(fromM);
      const endM = isNaN(toM) ? startM : Math.floor(toM);
      
      if (startM > 0) {
        for (let m = startM; m <= endM; m++) {
          const meterEntries = map.get(m) || [];
          meterEntries.push({ entry, index: idx });
          map.set(m, meterEntries);
        }
      }
    });
    return map;
  }, [inspectionEntries]);

  // Handle Defect Type Selection in Quick Entry
  const handleDefectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setQuickDefectTypeId(selectedId);
    if (selectedId && Array.isArray(defectMasterList)) {
      const found = defectMasterList.find((d: any) => String(d.id) === selectedId);
      if (found && found.defectPoint !== undefined) {
        setQuickDefectPoints(String(found.defectPoint));
      }
    }
  };

  // Handle Defect Type Selection in Popup
  const handlePopupDefectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setPopupDefectTypeId(selectedId);
    if (selectedId && Array.isArray(defectMasterList)) {
      const found = defectMasterList.find((d: any) => String(d.id) === selectedId);
      if (found && found.defectPoint !== undefined) {
        setPopupDefectPoints(String(found.defectPoint));
      }
    }
  };

  // Add or Update Defect at multiple or single meters in single click (Toolbar)
  const handleAddQuickDefect = () => {
    const meters = parseMeterNumbers(quickMeter, totalMetersCount);
    if (meters.length === 0) {
      alert(`Please enter valid meter number(s) between 1 and ${totalMetersCount} (e.g. 4, 12, 19 or 10-15)`);
      return;
    }
    if (!quickDefectTypeId) {
      alert('Please select a Defect Type');
      return;
    }

    const points = quickDefectPoints || '0';
    let updatedEntries = [...inspectionEntries];

    meters.forEach((meterNum) => {
      const meterStr = String(meterNum);
      const existingIdx = updatedEntries.findIndex(
        (e) => String(e.fromMeters) === meterStr
          && String(e.toMeters) === meterStr
          && String(e.defectTypeId) === quickDefectTypeId
      );

      if (existingIdx >= 0) {
        updatedEntries[existingIdx] = {
          ...updatedEntries[existingIdx],
          defectTypeId: quickDefectTypeId,
          defectPoints: points,
          defectedMeters: '1',
          fromMeters: meterStr,
          toMeters: meterStr,
        };
      } else {
        updatedEntries.push({
          fabricInspectionId: '',
          defectedMeters: '1',
          fromMeters: meterStr,
          toMeters: meterStr,
          defectTypeId: quickDefectTypeId,
          defectPoints: points,
          activeFlag: true,
        });
      }
    });

    onChangeEntries(updatedEntries);
    setQuickMeter('');
  };

  // Add or Update Defect in Popup (Keeps popup open so user can continuously add defects!)
  const handlePopupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPopupStatusMsg(null);

    const meters = parseMeterNumbers(popupMeterInput, totalMetersCount);
    if (meters.length === 0) {
      setPopupStatusMsg({
        type: 'error',
        text: `Please enter valid meter number(s) between 1 and ${totalMetersCount} (e.g. 4, 12, 25 or 10-15).`
      });
      return;
    }
    if (!popupDefectTypeId) {
      setPopupStatusMsg({
        type: 'error',
        text: 'Please select a Defect Type.'
      });
      return;
    }

    const points = popupDefectPoints || '0';
    let updatedEntries = [...inspectionEntries];

    meters.forEach((meterNum) => {
      const meterStr = String(meterNum);
      const existingIdx = updatedEntries.findIndex(
        (entry) => String(entry.fromMeters) === meterStr
          && String(entry.toMeters) === meterStr
          && String(entry.defectTypeId) === popupDefectTypeId
      );

      if (existingIdx >= 0) {
        updatedEntries[existingIdx] = {
          ...updatedEntries[existingIdx],
          defectTypeId: popupDefectTypeId,
          defectPoints: points,
          defectedMeters: '1',
          fromMeters: meterStr,
          toMeters: meterStr,
        };
      } else {
        updatedEntries.push({
          fabricInspectionId: '',
          defectedMeters: '1',
          fromMeters: meterStr,
          toMeters: meterStr,
          defectTypeId: popupDefectTypeId,
          defectPoints: points,
          activeFlag: true,
        });
      }
    });

    onChangeEntries(updatedEntries);

    setPopupStatusMsg({
      type: 'success',
      text: `✓ Successfully set defect for ${meters.length} meter(s): ${meters.length > 8 ? meters.slice(0, 8).join(', ') + '...' : meters.join(', ')}`
    });

    // Clear meter input, keep defect type & points if option checked, keep popup OPEN
    setPopupMeterInput('');
    if (!keepDefectType) {
      setPopupDefectTypeId('');
      setPopupDefectPoints('');
    }

    // Refocus on meter input for rapid continuous entry
    setTimeout(() => {
      popupInputRef.current?.focus();
    }, 50);
  };

  // Remove defect at meter
  const handleRemoveDefectAtMeter = (meterNum: number, entryIndex?: number) => {
    const existing = meterDefectMap.get(meterNum) || [];
    const indexesToRemove = entryIndex == null
      ? new Set(existing.map(({ index }) => index))
      : new Set([entryIndex]);
    if (indexesToRemove.size > 0) {
      const updated = inspectionEntries.filter((_, idx) => !indexesToRemove.has(idx));
      onChangeEntries(updated);
    }
  };

  // Calculate stats
  const totalPoints = useMemo(() => {
    return inspectionEntries.reduce((sum, entry) => sum + (parseFloat(entry.defectPoints) || 0), 0);
  }, [inspectionEntries]);

  // Build 5 columns of 100 meters each (1-100, 101-200, 201-300, 301-400, 401-500)
  const columnsData = useMemo(() => {
    const cols: { title: string; start: number; end: number; meters: number[] }[] = [
      { title: '1 - 100 Mtr', start: 1, end: 100, meters: [] },
      { title: '101 - 200 Mtr', start: 101, end: 200, meters: [] },
      { title: '201 - 300 Mtr', start: 201, end: 300, meters: [] },
      { title: '301 - 400 Mtr', start: 301, end: 400, meters: [] },
      { title: '401 - 500 Mtr', start: 401, end: 500, meters: [] },
    ];

    cols.forEach((col) => {
      for (let m = col.start; m <= col.end && m <= totalMetersCount; m++) {
        col.meters.push(m);
      }
    });

    return cols;
  }, [totalMetersCount]);

  const filteredColumns = useMemo(() => {
    if (selectedColumnRange === 0) return columnsData;
    return [columnsData[selectedColumnRange - 1]];
  }, [columnsData, selectedColumnRange]);

  const getDefectName = (typeId: string) => {
    const found = defectMasterList.find((d: any) => String(d.id) === typeId);
    return found?.defectName || found?.name || `Type ${typeId}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Warehouse Inspection Report (1 - 500 Meter Defect Sheet)"
      size="7xl"
    >
      <div className="space-y-4">
        {/* Top Stats Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Roll Meter Target:</span>{' '}
              <span className="font-bold text-gray-900">{maxMeters} Mtrs</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium font-medium">Defect Entries:</span>{' '}
              <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {inspectionEntries.length} Defects
              </span>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Total Defect Points:</span>{' '}
              <span className="font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full text-base">
                {totalPoints} Points
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-600" /> Matches Physical Paper Inspection Grid (1 - 500 Mtr)
          </div>
        </div>

        {/* Quick Add Defect Toolbar */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Plus size={14} className="text-primary" /> Quick Add / Edit Defect at Meter Serial No.
            </h4>
            <Button
              type="button"
              onClick={() => {
                setPopupStatusMsg(null);
                setIsMultiPopupOpen(true);
                setTimeout(() => popupInputRef.current?.focus(), 100);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1 flex items-center gap-1.5 rounded-md shadow-sm"
            >
              <Layers size={14} /> + Multi-Defect Add Popup
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Meter Serial No(s) (1 - {totalMetersCount})
              </label>
              <input
                type="text"
                value={quickMeter}
                onChange={(e) => setQuickMeter(e.target.value)}
                placeholder="e.g. 4, 26, 119 or 10-15"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Defect Type</label>
              <select
                value={quickDefectTypeId}
                onChange={handleDefectTypeChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select Defect Type</option>
                {defectTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                value={quickDefectPoints}
                onChange={(e) => setQuickDefectPoints(e.target.value)}
                placeholder="Points"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button
                type="button"
                onClick={handleAddQuickDefect}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium text-xs py-2 rounded-md shadow-sm"
              >
                Set Defect at Meter(s)
              </Button>
            </div>
          </div>
        </div>

        {/* Filter & Range Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-gray-600 mr-1">Range View:</span>
            <button
              type="button"
              onClick={() => setSelectedColumnRange(0)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedColumnRange === 0 ? 'bg-primary text-white font-medium shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All (1-500)
            </button>
            {columnsData.map((col, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setSelectedColumnRange(idx + 1)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedColumnRange === idx + 1 ? 'bg-primary text-white font-medium shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {col.title}
              </button>
            ))}
          </div>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Meter #..."
              className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* 5-Column Grid Sheet */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className={`grid ${filteredColumns.length === 5 ? 'grid-cols-5' : 'grid-cols-1'} divide-x divide-gray-300 text-xs`}>
            {filteredColumns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col">
                <div className="bg-primary text-white font-semibold text-center py-2 px-2 text-xs uppercase tracking-wide sticky top-0 z-10 shadow-sm">
                  {col.title}
                </div>
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-200">
                  {col.meters
                    .filter((m) => !searchQuery || String(m).includes(searchQuery.trim()))
                    .map((m) => {
                      const defData = meterDefectMap.get(m) || [];
                      const isDefected = defData.length > 0;
                      return (
                        <div
                          key={m}
                          className={`flex items-center justify-between px-2.5 py-1.5 hover:bg-primary/10 transition-colors cursor-pointer ${
                            isDefected ? 'bg-red-50 font-medium' : ''
                          }`}
                          onClick={() => {
                            setQuickMeter(String(m));
                            setPopupMeterInput(String(m));
                            setPopupStatusMsg(null);
                            if (defData.length > 0) {
                              setQuickDefectTypeId(defData[0].entry.defectTypeId);
                              setQuickDefectPoints(defData[0].entry.defectPoints);
                              setPopupDefectTypeId(defData[0].entry.defectTypeId);
                              setPopupDefectPoints(defData[0].entry.defectPoints);
                            } else {
                              if (!keepDefectType || !popupDefectTypeId) {
                                setPopupDefectTypeId('');
                                setPopupDefectPoints('');
                              }
                            }
                            setIsMultiPopupOpen(true);
                            setTimeout(() => popupInputRef.current?.focus(), 100);
                          }}
                        >
                          <span className={`w-8 text-center font-mono ${isDefected ? 'text-red-700 font-bold' : 'text-gray-600'}`}>
                            {m}
                          </span>

                          <div className="flex-1 px-2 text-right">
                            {isDefected ? (
                              <div className="flex flex-wrap justify-end gap-1">
                                {defData.map(({ entry, index }) => (
                                  <span
                                    key={`${index}-${entry.defectTypeId}`}
                                    className="inline-flex items-center gap-1 bg-red-100 border border-red-300 text-red-800 text-[11px] px-2 py-0.5 rounded font-semibold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickMeter(String(m));
                                      setQuickDefectTypeId(entry.defectTypeId);
                                      setQuickDefectPoints(entry.defectPoints);
                                      setPopupMeterInput(String(m));
                                      setPopupDefectTypeId(entry.defectTypeId);
                                      setPopupDefectPoints(entry.defectPoints);
                                      setPopupStatusMsg(null);
                                      setIsMultiPopupOpen(true);
                                      setTimeout(() => popupInputRef.current?.focus(), 100);
                                    }}
                                  >
                                    {getDefectName(entry.defectTypeId)} ({entry.defectPoints} pts)
                                    <button
                                      type="button"
                                      aria-label={`Delete ${getDefectName(entry.defectTypeId)} at meter ${m}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDefectAtMeter(m, index);
                                      }}
                                      className="text-red-700 hover:text-red-900"
                                    >
                                      <X size={11} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-[11px]">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-gray-500">
            Click on any meter serial number in the grid to open the Defect Popup, or use the Multi-Defect Add Popup button.
          </span>
          <Button type="button" onClick={onClose} className="bg-primary hover:bg-primary/90 text-white px-6 py-1.5 text-xs font-medium shadow-sm">
            Done & Save Grid
          </Button>
        </div>

        {/* Continuous Multi-Defect Add Popup - Only closes when user explicitly closes it! */}
        {isMultiPopupOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Popup Header */}
              <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} />
                  <h3 className="font-semibold text-sm">Add / Edit Defects (Continuous Multi-Meter)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMultiPopupOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                  title="Close popup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Popup Body */}
              <form onSubmit={handlePopupSubmit} className="p-4 space-y-4">
                {/* Status / Feedback message */}
                {popupStatusMsg && (
                  <div
                    className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                      popupStatusMsg.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {popupStatusMsg.type === 'success' ? (
                      <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{popupStatusMsg.text}</span>
                  </div>
                )}

                {/* Meter Numbers Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Meter Serial No(s) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-gray-500">Range: 1 to {totalMetersCount}</span>
                  </div>
                  <input
                    ref={popupInputRef}
                    type="text"
                    value={popupMeterInput}
                    onChange={(e) => setPopupMeterInput(e.target.value)}
                    placeholder="e.g. 4, 12, 19, 25 or 30-35"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter a single meter (e.g. <span className="font-mono font-semibold">12</span>), multiple meters (e.g. <span className="font-mono font-semibold">4, 15, 28</span>), or ranges (e.g. <span className="font-mono font-semibold">10-15</span>). All will be added in a single click!
                  </p>
                </div>

                {/* Defect Type Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Defect Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={popupDefectTypeId}
                    onChange={handlePopupDefectTypeChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                  >
                    <option value="">Select Defect Type</option>
                    {defectTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Defect Points */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Defect Points</label>
                  <input
                    type="number"
                    value={popupDefectPoints}
                    onChange={(e) => setPopupDefectPoints(e.target.value)}
                    placeholder="Defect Points"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                  />
                </div>

                {/* Keep Defect Type Option */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="keepDefectTypeCheck"
                    checked={keepDefectType}
                    onChange={(e) => setKeepDefectType(e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="keepDefectTypeCheck" className="text-xs text-gray-700 select-none cursor-pointer">
                    Keep Defect Type & Points selected for next continuous entry
                  </label>
                </div>

                {/* Popup Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  {popupMeterInput.trim() !== '' &&
                    !popupMeterInput.includes(',') &&
                    !popupMeterInput.includes('-') &&
                    meterDefectMap.has(parseInt(popupMeterInput.trim(), 10)) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const mNum = parseInt(popupMeterInput.trim(), 10);
                          const selectedEntry = meterDefectMap.get(mNum)?.find(
                            ({ entry }) => String(entry.defectTypeId) === popupDefectTypeId
                          );
                          if (selectedEntry) {
                            handleRemoveDefectAtMeter(mNum, selectedEntry.index);
                            setPopupStatusMsg({
                              type: 'success',
                              text: `✓ Removed defect from meter ${mNum}.`
                            });
                            setPopupMeterInput('');
                          }
                        }}
                        className="text-xs py-1.5"
                      >
                        <Trash2 size={13} className="mr-1" /> Delete Defect
                      </Button>
                    )}

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMultiPopupOpen(false)}
                      className="text-xs py-1.5"
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-4 py-1.5 shadow-sm"
                    >
                      Set Defect(s) (Single Click)
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
