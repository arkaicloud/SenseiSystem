import React from "react";
import PendingApprovalsBatch from "@/components/admin/PendingApprovalsBatch";

const PendingUsers: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <PendingApprovalsBatch />
    </div>
  );
};

export default PendingUsers;