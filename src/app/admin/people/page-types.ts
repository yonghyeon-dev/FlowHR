export type Organization = { id: string; name: string };

export type Department = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
};

export type Position = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
};

export type Employee = {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  positionId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
  updatedAt: string;
};

export type EmployeeHistory = {
  action: string;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: string;
};

export type ApiLog = { id: number; label: string; status: number; ok: boolean; at: string };

export type ActiveFilter = "all" | "active" | "inactive";
export type UpdatedWindow = "all" | "7" | "30" | "90";
export type ProfileField =
  | "organizationId"
  | "departmentId"
  | "positionId"
  | "name"
  | "email"
  | "active";

export type OrgTreeDepartmentNode = {
  deptKey: string;
  deptName: string;
  employees: Employee[];
};

export type OrgTreeNode = {
  orgKey: string;
  orgName: string;
  departments: OrgTreeDepartmentNode[];
};

export type CompareRow = {
  label: string;
  a: string;
  b: string;
  diff: boolean;
};

export type HistoryEntryChange = {
  field: ProfileField;
  before: string;
  after: string;
};

export type HistoryChangeSummaryItem = {
  field: ProfileField;
  label: string;
  count: number;
};
