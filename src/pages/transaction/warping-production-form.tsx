import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { WarpingProductionForm } from "@/components/warping/WarpingProductionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppDispatch, RootState } from "@/state/store";
import { getWarpingProductionById } from "@/state/warpingProductionSlice";

export function WarpingProductionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const warpingState = useSelector((state: RootState) => (state as any).warpingProduction || {});
  const { currentRecord, loading } = warpingState;

  const isEditMode = Boolean(id);
  const numericId = id ? Number(id) : null;

  useEffect(() => {
    if (isEditMode && numericId != null) {
      if (!currentRecord || Number(currentRecord.id) !== numericId) {
        dispatch(getWarpingProductionById(numericId));
      }
    }
  }, [dispatch, isEditMode, numericId, currentRecord]);

  const handleCancel = () => {
    navigate("/transaction/warping-production");
  };

  const handleSuccess = () => {
    navigate("/transaction/warping-production");
  };

  const pageTitle = isEditMode ? "Edit Warping Production" : "Add Warping Production";
  const pageSubtitle = isEditMode
    ? "Update the selected warping production details."
    : "Capture warping production details with synchronized row controls.";
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
            {loading ? "Loading production details..." : "Fetching record..."}
          </div>
        ) : (
          <WarpingProductionForm
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
