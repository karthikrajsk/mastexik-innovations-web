import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SizingBeamOutwardForm } from "@/components/sizing/SizingBeamOutwardForm";
import { AppDispatch, RootState } from "@/state/store";
import { getSizingBeamOutwardById } from "@/state/sizingBeamOutwardSlice";

export function SizingBeamOutwardFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const sizingBeamOutwardState = useSelector((state: RootState) => (state as any).sizingBeamOutward || {});
  const { currentRecord, loading } = sizingBeamOutwardState;

  const isEditMode = Boolean(id);
  const numericId = id ? Number(id) : null;

  useEffect(() => {
    if (isEditMode && numericId != null) {
      if (!currentRecord || Number(currentRecord?.id) !== numericId) {
        dispatch(getSizingBeamOutwardById(numericId));
      }
    }
  }, [dispatch, isEditMode, numericId, currentRecord]);

  const handleCancel = () => {
    navigate("/transaction/sizing-beam-outward");
  };

  const handleSuccess = () => {
    navigate("/transaction/sizing-beam-outward");
  };

  const pageTitle = isEditMode ? "Edit Sizing Beam Outward" : "Add Sizing Beam Outward";
  const pageSubtitle = isEditMode
    ? "Update the selected sizing beam outward details."
    : "Capture sizing beam outward details with order, beam, and summary information.";
  const submitLabel = isEditMode ? "Update" : "Save";
  const recordReady = !isEditMode || (numericId != null && currentRecord && Number(currentRecord.id) === numericId);

  return (
    <div className="p-6 pt-16 space-y-6 mt-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleCancel} className="mr-auto">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        {isEditMode && !recordReady ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {loading ? "Loading sizing beam outward details..." : "Fetching record..."}
          </div>
        ) : (
          <SizingBeamOutwardForm
            mode={isEditMode ? "edit" : "create"}
            initialRecord={isEditMode ? currentRecord : undefined}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            submitLabel={submitLabel}
          />
        )}
      </div>
    </div>
  );
}
