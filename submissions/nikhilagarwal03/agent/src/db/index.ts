export type PackRecordStatus = "pending" | "complete";

export type PackRecord = {
  recordId: string;
  unitId: string;
  orgId: string;
  status: PackRecordStatus;
};

export { connectToDatabase } from "./connect";
export {
  applyOrganizationRls,
  SECURITY_VIOLATION_ERR,
  SecurityViolationError,
} from "./middleware/rls";