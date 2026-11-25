import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    approveDate: new Date().toISOString().split("T")[0],
    comments: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        approveDate: new Date().toISOString().split("T")[0],
        comments: initialData?.comments || ""
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      userId: user?.id
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approval Details">
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Approve Date</label>
          <input
            type="date"
            name="approveDate"
            value={formData.approveDate}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Optional approval notes"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
