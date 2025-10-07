"use client";

import { useCompany } from "~/hooks/useCompany";

export default function CompanyManagement() {
  const { company, setCompany, handleSubmit } = useCompany();
  return (
    <div>
      Company Management
      <input
        value={company}
        type="text"
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
