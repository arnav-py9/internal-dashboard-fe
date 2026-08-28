// ─── Mock data types & seed data ──────────────────────────────────────────────
// Replace the seed arrays below with API calls when connecting to the backend.
// The type definitions should match what the FastAPI routes will return.

export type BatchStatus = "active" | "completed" | "ended_early" | "settled" | "cancelled" | "draft";

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: "active" | "inactive";
  notes: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  clientId: string;
  batchName: string;
  committedVideos: number;
  committedValue: number; // total contract value in INR
  startDate: string;
  expectedEndDate: string;
  status: BatchStatus;
  endedEarlyReason?: string;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  batchId: string;
  amount: number;
  date: string;
  receivedIn: "Business" | "Personal" | "Slice" | "Other";
  notes: string;
}

export interface DeliveryLog {
  id: string;
  batchId: string;
  videosCompleted: number;
  date: string;
  notes: string;
}

export interface Settlement {
  id: string;
  batchId: string;
  amount: number;
  date: string;
  fromAccount: "Personal" | "Business" | "Slice" | "Other";
  toAccount: "Business" | "Personal" | "Slice" | "Other";
  notes: string;
}

// ── Activity feed entry (derived, not stored) ──────────────────────────────────
export interface ActivityEntry {
  id: string;
  clientId: string;
  clientName: string;
  type: "delivery" | "payment" | "settlement" | "batch_created" | "batch_ended";
  description: string;
  amount?: number;
  date: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "ABC Brand",
    contactName: "Rahul Sharma",
    contactEmail: "rahul@abcbrand.in",
    contactPhone: "+91 98100 12345",
    status: "active",
    notes: "Long-term content partner. Monthly video batches.",
    createdAt: "2026-01-15",
  },
  {
    id: "c2",
    name: "XYZ Media",
    contactName: "Priya Verma",
    contactEmail: "priya@xyzmedia.co",
    contactPhone: "+91 99000 54321",
    status: "active",
    notes: "Social media content, short-form videos.",
    createdAt: "2026-02-20",
  },
  {
    id: "c3",
    name: "DEF Studio",
    contactName: "Arjun Mehta",
    contactEmail: "arjun@defstudio.io",
    contactPhone: "+91 97300 11223",
    status: "active",
    notes: "Corporate videos and product demos.",
    createdAt: "2026-03-10",
  },
  {
    id: "c4",
    name: "GHI Ventures",
    contactName: "Nisha Kapoor",
    contactEmail: "nisha@ghiventures.com",
    contactPhone: "+91 88000 77654",
    status: "active",
    notes: "Startup marketing content.",
    createdAt: "2026-04-01",
  },
  {
    id: "c5",
    name: "Old Client Co",
    contactName: "Vikram Singh",
    contactEmail: "vikram@oldclient.in",
    contactPhone: "+91 91200 33456",
    status: "inactive",
    notes: "No active batches. Project concluded.",
    createdAt: "2025-08-05",
  },
];

export const INITIAL_BATCHES: Batch[] = [
  // ABC Brand – active batch (partial payment, partial delivery)
  {
    id: "b1",
    clientId: "c1",
    batchName: "August Batch",
    committedVideos: 27,
    committedValue: 270000,
    startDate: "2026-08-01",
    expectedEndDate: "2026-08-31",
    status: "active",
    notes: "YouTube + Instagram reels package.",
    createdAt: "2026-08-01",
  },
  // ABC Brand – completed & settled batch
  {
    id: "b2",
    clientId: "c1",
    batchName: "July Batch",
    committedVideos: 20,
    committedValue: 200000,
    startDate: "2026-07-01",
    expectedEndDate: "2026-07-31",
    status: "settled",
    notes: "Completed on time.",
    createdAt: "2026-07-01",
  },
  // ABC Brand – completed (unsettled)
  {
    id: "b3",
    clientId: "c1",
    batchName: "June Batch",
    committedVideos: 15,
    committedValue: 150000,
    startDate: "2026-06-01",
    expectedEndDate: "2026-06-30",
    status: "completed",
    notes: "All videos delivered. Settlement pending.",
    createdAt: "2026-06-01",
  },
  // ABC Brand – old settled
  {
    id: "b4",
    clientId: "c1",
    batchName: "May Batch",
    committedVideos: 10,
    committedValue: 100000,
    startDate: "2026-05-01",
    expectedEndDate: "2026-05-31",
    status: "settled",
    notes: "",
    createdAt: "2026-05-01",
  },
  // XYZ Media – active, full upfront payment, partial delivery
  {
    id: "b5",
    clientId: "c2",
    batchName: "Q3 Content",
    committedVideos: 12,
    committedValue: 96000,
    startDate: "2026-07-15",
    expectedEndDate: "2026-09-15",
    status: "active",
    notes: "Quarterly retainer.",
    createdAt: "2026-07-15",
  },
  // DEF Studio – ended early
  {
    id: "b6",
    clientId: "c3",
    batchName: "Product Launch Series",
    committedVideos: 10,
    committedValue: 120000,
    startDate: "2026-06-01",
    expectedEndDate: "2026-07-15",
    status: "ended_early",
    endedEarlyReason: "Client paused project due to budget constraints.",
    notes: "",
    createdAt: "2026-06-01",
  },
  // GHI Ventures – active, multiple payments
  {
    id: "b7",
    clientId: "c4",
    batchName: "Launch Campaign",
    committedVideos: 8,
    committedValue: 64000,
    startDate: "2026-08-05",
    expectedEndDate: "2026-09-05",
    status: "active",
    notes: "Startup launch content.",
    createdAt: "2026-08-05",
  },
  // Old Client Co – cancelled
  {
    id: "b8",
    clientId: "c5",
    batchName: "Annual Package",
    committedVideos: 24,
    committedValue: 240000,
    startDate: "2025-09-01",
    expectedEndDate: "2026-08-31",
    status: "cancelled",
    notes: "Cancelled due to project scope change.",
    createdAt: "2025-09-01",
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  // b1 – ABC Brand August Batch: partial upfront
  { id: "p1", batchId: "b1", amount: 135000, date: "2026-08-01", receivedIn: "Business", notes: "50% upfront" },
  // b2 – ABC Brand July Batch: full payment (2 instalments)
  { id: "p2", batchId: "b2", amount: 100000, date: "2026-07-01", receivedIn: "Business", notes: "First instalment" },
  { id: "p3", batchId: "b2", amount: 100000, date: "2026-07-15", receivedIn: "Business", notes: "Second instalment" },
  // b3 – June Batch: full upfront
  { id: "p4", batchId: "b3", amount: 150000, date: "2026-06-01", receivedIn: "Personal", notes: "Full upfront" },
  // b4 – May Batch: full upfront
  { id: "p5", batchId: "b4", amount: 100000, date: "2026-05-01", receivedIn: "Business", notes: "" },
  // b5 – XYZ Media: full upfront
  { id: "p6", batchId: "b5", amount: 96000, date: "2026-07-15", receivedIn: "Slice", notes: "Full payment via Slice" },
  // b6 – DEF Studio: partial (ended early)
  { id: "p7", batchId: "b6", amount: 60000, date: "2026-06-01", receivedIn: "Business", notes: "50% advance" },
  // b7 – GHI Ventures: 2 payments
  { id: "p8", batchId: "b7", amount: 32000, date: "2026-08-05", receivedIn: "Business", notes: "First instalment" },
  { id: "p9", batchId: "b7", amount: 16000, date: "2026-08-10", receivedIn: "Personal", notes: "Second instalment" },
  // b8 – Old Client: advance before cancellation
  { id: "p10", batchId: "b8", amount: 80000, date: "2025-09-01", receivedIn: "Business", notes: "Advance; refunded separately" },
];

export const INITIAL_DELIVERY_LOGS: DeliveryLog[] = [
  // b1 – ABC Brand August Batch
  { id: "d1", batchId: "b1", videosCompleted: 10, date: "2026-08-10", notes: "First 10 reels delivered" },
  { id: "d2", batchId: "b1", videosCompleted: 5, date: "2026-08-20", notes: "5 YouTube videos delivered" },
  // b2 – July Batch: all 20 delivered
  { id: "d3", batchId: "b2", videosCompleted: 20, date: "2026-07-28", notes: "Full batch delivered" },
  // b3 – June Batch: all 15
  { id: "d4", batchId: "b3", videosCompleted: 15, date: "2026-06-28", notes: "All videos delivered" },
  // b4 – May Batch
  { id: "d5", batchId: "b4", videosCompleted: 10, date: "2026-05-30", notes: "" },
  // b5 – XYZ Media: 7 of 12 so far
  { id: "d6", batchId: "b5", videosCompleted: 4, date: "2026-08-01", notes: "First set" },
  { id: "d7", batchId: "b5", videosCompleted: 3, date: "2026-08-12", notes: "Second set" },
  // b6 – DEF Studio: ended early, only 5 of 10
  { id: "d8", batchId: "b6", videosCompleted: 5, date: "2026-06-20", notes: "Delivered before pause" },
  // b7 – GHI Ventures: 3 of 8
  { id: "d9", batchId: "b7", videosCompleted: 3, date: "2026-08-15", notes: "First set delivered" },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  // b2 – July Batch: fully settled
  { id: "s1", batchId: "b2", amount: 200000, date: "2026-07-30", fromAccount: "Business", toAccount: "Personal", notes: "Full settlement" },
  // b4 – May Batch: settled
  { id: "s2", batchId: "b4", amount: 100000, date: "2026-06-02", fromAccount: "Business", toAccount: "Personal", notes: "" },
  // b3 – June Batch: partial settlement
  { id: "s3", batchId: "b3", amount: 50000, date: "2026-08-17", fromAccount: "Business", toAccount: "Personal", notes: "Partial settlement" },
];
