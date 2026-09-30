export type VisionObservation = {
  sku: string;
  quantity: number;
  confidence?: number;
  evidenceRef?: string;
};

export type VisionResult = {
  observations: VisionObservation[];
  status: "complete" | "pending";
};