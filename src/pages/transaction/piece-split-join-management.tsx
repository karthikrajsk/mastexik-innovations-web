import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedRow {
  id: number;
  mode: "SPLIT" | "JOIN";
  pieceNo: string;
  pieceMeter: string;
  netWeight: string;
  avgWt: string;
  loomNo?: string;
  beamNo?: string;
  flangeNo?: string;
  fabricLabel?: string;
}

export default function PieceSplitJoinManagement() {
  const navigate = useNavigate();
  const STORAGE_KEY = "psj_saved";
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [activeTab, setActiveTab] = useState<"SPLIT" | "JOIN">("SPLIT");

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try { setSaved(JSON.parse(data)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const filtered = useMemo(() => saved.filter(s => s.mode === activeTab), [saved, activeTab]);

  const onEdit = (id: number) => {
    navigate("/transaction/piece-split-join", { state: { editId: id } });
  };

  const onDelete = (id: number) => {
    setSaved(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="p-6 pt-16 space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 border-b mb-4">
            <button
              className={`pb-2 px-4 ${activeTab === "SPLIT" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
              onClick={() => setActiveTab("SPLIT")}
            >
              Split
            </button>
            <button
              className={`pb-2 px-4 ${activeTab === "JOIN" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
              onClick={() => setActiveTab("JOIN")}
            >
              Join
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">S.No</th>
                  <th className="border p-2">Piece No</th>
                  <th className="border p-2">Loom No</th>
                  <th className="border p-2">Beam No</th>
                  <th className="border p-2">Empty Beam No</th>
                  <th className="border p-2">Sort No - Construction</th>
                  <th className="border p-2">Piece Meter</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="border">
                    <td className="border p-2">{idx + 1}</td>
                    <td className="border p-2">{s.pieceNo}</td>
                    <td className="border p-2">{s.loomNo || "-"}</td>
                    <td className="border p-2">{s.beamNo || "-"}</td>
                    <td className="border p-2">{s.flangeNo || "-"}</td>
                    <td className="border p-2">{s.fabricLabel || "-"}</td>
                    <td className="border p-2">{s.pieceMeter || ""}</td>
                    <td className="border p-2 space-x-2">
                      <button onClick={() => onEdit(s.id)} className="mr-2 text-blue-500"><Edit size={18} /></button>
                      <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="border p-2 text-gray-500" colSpan={8}>No entries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
