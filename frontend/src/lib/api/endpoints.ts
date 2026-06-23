import type {
  BillingSession,
  CreateTrackerInput,
  CreditAccount,
  CreditLedgerEntry,
  GenerateOutreachInput,
  LeadStatus,
  PublicProfile,
  SignalView,
  Tracker,
  TrackerRunResult,
  UpdateProfileInput,
  UpdateTrackerInput,
} from "@signalscout/shared";
import { apiFetch } from "./client";

export const api = {
  me: () => apiFetch<PublicProfile>("/me"),
  updateMe: (input: UpdateProfileInput) =>
    apiFetch<PublicProfile>("/me", { method: "PATCH", body: JSON.stringify(input) }),
  claimWelcome: () => apiFetch<void>("/me/welcome", { method: "POST" }),

  credits: () => apiFetch<CreditAccount>("/credits"),
  ledger: () => apiFetch<CreditLedgerEntry[]>("/credits/ledger"),

  trackers: () => apiFetch<Tracker[]>("/trackers"),
  tracker: (id: string) => apiFetch<Tracker>(`/trackers/${id}`),
  createTracker: (input: CreateTrackerInput) =>
    apiFetch<Tracker>("/trackers", { method: "POST", body: JSON.stringify(input) }),
  updateTracker: (id: string, input: UpdateTrackerInput) =>
    apiFetch<Tracker>(`/trackers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTracker: (id: string) =>
    apiFetch<void>(`/trackers/${id}`, { method: "DELETE" }),
  runTracker: (id: string) =>
    apiFetch<TrackerRunResult>(`/trackers/${id}/run`, { method: "POST" }),

  signals: (query = "") => apiFetch<SignalView[]>(`/signals${query}`),
  signal: (id: string) => apiFetch<SignalView>(`/signals/${id}`),
  updateSignalStatus: (id: string, status: LeadStatus) =>
    apiFetch<SignalView>(`/signals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  generateOutreach: (id: string, input: GenerateOutreachInput) =>
    apiFetch<SignalView>(`/signals/${id}/outreach`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  checkout: () => apiFetch<BillingSession>("/billing/checkout", { method: "POST" }),
  portal: () => apiFetch<BillingSession>("/billing/portal", { method: "POST" }),
};
