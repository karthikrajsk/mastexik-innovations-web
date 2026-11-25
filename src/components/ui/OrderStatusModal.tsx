import { Modal } from "@/components/ui/Modal";
import React, { useState, useEffect } from "react";

interface TransactionData {
  transactionTypeId?: number;
  vendorId?: number;
  buyerId?: number;
  [key: string]: any;
}

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (completionDate: string, description: string, transactionData?: TransactionData) => void;
  transactionData?: TransactionData | null;
}

export function OrderStatusModal({
  isOpen,
  onClose,
  onSave,
  transactionData,
}: OrderStatusModalProps) {
  const [completionDate, setCompletionDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<{ completionDate?: string }>({});
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [buyerId, setBuyerId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && transactionData) {
      setVendorId(transactionData.vendorId || null);
      setBuyerId(transactionData.buyerId || null);
    }
  }, [isOpen, transactionData]);

  const handleSave = () => {
    const newErrors: { completionDate?: string } = {};

    if (!completionDate) {
      newErrors.completionDate = "Date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSave: TransactionData = {
      ...transactionData,
      vendorId: vendorId || undefined,
      buyerId: buyerId || undefined,
      status: status || undefined
    };

    onSave(completionDate, description, dataToSave);
    setCompletionDate("");
    setDescription("");
    setStatus("");
    setErrors({});
  };

  const handleClose = () => {
    setCompletionDate("");
    setDescription("");
    setStatus("");
    setErrors({});
    setVendorId(null);
    setBuyerId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Order"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Completion Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={completionDate}
            onChange={(e) => {
              setCompletionDate(e.target.value);
              if (errors.completionDate) {
                setErrors({ ...errors, completionDate: undefined });
              }
            }}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 ${
              errors.completionDate
                ? "border-red-500 focus:ring-red-500"
                : "border-secondary-300 focus:ring-primary-500"
            }`}
          />
          {errors.completionDate && (
            <p className="text-red-500 text-sm mt-1">{errors.completionDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter any additional notes..."
            rows={4}
            className="w-full px-3 py-2 border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Enter status..."
            className="w-full px-3 py-2 border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div> */}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
