import React, { useState, useEffect } from 'react';
import { NewProductionPayload } from '@/types/beamCard';
import { X, PlusCircle, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewProductionPayload) => void;
  beamNo: string;
  isFactory?: boolean;
}

export const ProductionEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  beamNo,
  isFactory = false
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [doffLength, setDoffLength] = useState<string>('380');
  const [pieceNo, setPieceNo] = useState<string>('');
  const [rollLength, setRollLength] = useState<string>('');
  const [rollWeight, setRollWeight] = useState<string>('');
  const [rollGlm, setRollGlm] = useState<string>('');
  const [isInspected, setIsInspected] = useState<boolean>(true);
  const [inspectedMtr, setInspectedMtr] = useState<string>('');
  const [weftDate, setWeftDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weftMillName, setWeftMillName] = useState<string>('L.S. MILLS');
  const [weftLotNo, setWeftLotNo] = useState<string>('64');

  // Auto-calculate GLM if weight & length are provided and GLM is not explicitly set
  useEffect(() => {
    if (isFactory && rollWeight && rollLength) {
      const numWt = Number(rollWeight);
      const numLen = Number(inspectedMtr || rollLength);
      if (numWt > 0 && numLen > 0) {
        const computed = ((numWt * 1000) / numLen).toFixed(2);
        setRollGlm(computed);
      }
    }
  }, [isFactory, rollWeight, rollLength, inspectedMtr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pieceNo || !rollLength) {
      alert("Please enter Piece No and Roll Length.");
      return;
    }

    const numRoll = Number(rollLength);
    const numInsp = inspectedMtr ? Number(inspectedMtr) : numRoll;

    onSubmit({
      date,
      doffLength: doffLength ? Number(doffLength) : undefined,
      pieceNo,
      rollLength: numRoll,
      rollWeight: rollWeight ? Number(rollWeight) : undefined,
      rollGlm: rollGlm ? Number(rollGlm) : undefined,
      inspectedMtr: isInspected ? numInsp : undefined,
      isInspected,
      weftDate: weftDate || date,
      weftMillName,
      weftLotNo
    });

    setPieceNo('');
    setRollLength('');
    setRollWeight('');
    setRollGlm('');
    setInspectedMtr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-slate-300 font-sans overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-sm">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Add Doffing / Inspection Production Record - Beam {beamNo}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Production Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Piece No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. 14585"
                value={pieceNo}
                onChange={(e) => setPieceNo(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Doff Length (Mtrs) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 380"
                value={doffLength}
                onChange={(e) => setDoffLength(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Initial Roll Length (Mtrs) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 374.50"
                value={rollLength}
                onChange={(e) => setRollLength(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Additional Factory Specific Fields */}
            {isFactory && (
              <>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-indigo-900">
                    Roll Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 52.40"
                    value={rollWeight}
                    onChange={(e) => setRollWeight(e.target.value)}
                    className="w-full border border-indigo-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 font-mono bg-indigo-50/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-indigo-900">
                    Roll GLM (G/M)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto or e.g. 139.80"
                    value={rollGlm}
                    onChange={(e) => setRollGlm(e.target.value)}
                    className="w-full border border-indigo-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 font-mono bg-indigo-50/30"
                  />
                </div>
              </>
            )}
          </div>

          {/* Inspection Checkbox & Inspected Mtrs */}
          <div className="bg-emerald-50/60 p-2.5 border border-emerald-200 rounded text-xs space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-emerald-900 font-sans">
              <input
                type="checkbox"
                checked={isInspected}
                onChange={(e) => setIsInspected(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Fabric Inspection Completed</span>
            </label>

            {isInspected && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Inspected Roll Length (Mtrs) - Will populate Roll Length column:
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Defaults to Roll Length if empty"
                  value={inspectedMtr}
                  onChange={(e) => setInspectedMtr(e.target.value)}
                  className="w-full border border-emerald-400 bg-white rounded px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-3">
            <span className="block text-slate-800 font-bold mb-2 uppercase text-2xs tracking-wider text-blue-700">
              Weft Yarn Issue Details (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Weft Date</label>
                <input
                  type="date"
                  value={weftDate}
                  onChange={(e) => setWeftDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-2xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Mill Name</label>
                <input
                  type="text"
                  placeholder="e.g. L.S. MILLS"
                  value={weftMillName}
                  onChange={(e) => setWeftMillName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-2xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Weft Lot No.</label>
                <input
                  type="text"
                  placeholder="e.g. 64"
                  value={weftLotNo}
                  onChange={(e) => setWeftLotNo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-2xs"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans font-medium"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
