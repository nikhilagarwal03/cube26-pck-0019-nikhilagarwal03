import type { Query, Schema } from "mongoose";

export const SECURITY_VIOLATION_ERR = "SECURITY_VIOLATION_ERR";

export class SecurityViolationError extends Error {
  readonly code = SECURITY_VIOLATION_ERR;

  constructor() {
    super("A database query requires an organization context");
    this.name = SECURITY_VIOLATION_ERR;
  }
}

export type OrganizationQueryOptions = {
  orgId?: unknown;
};

type OrganizationScopedQuery = Query<unknown, unknown> & {
  getOptions(): OrganizationQueryOptions;
  getFilter(): Record<string, unknown>;
  setQuery(filter: Record<string, unknown>): OrganizationScopedQuery;
};

const RLS_QUERY_METHODS: Array<"find" | "findOne" | "countDocuments"> = [
  "find",
  "findOne",
  "countDocuments",
];

export function applyOrganizationRls(schema: Schema): void {
  const enforceOrganization = function (this: OrganizationScopedQuery) {
    const { orgId } = this.getOptions();

    if (typeof orgId !== "string" || orgId.trim() === "") {
      throw new SecurityViolationError();
    }

    this.setQuery({
      ...this.getFilter(),
      organization_id: orgId,
    });
  };

  for (const method of RLS_QUERY_METHODS) {
    schema.pre(method, enforceOrganization);
  }
}
