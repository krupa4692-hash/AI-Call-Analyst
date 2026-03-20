export interface DashboardStats {
  total_calls: number;
  avg_call_score: number | null;
  avg_duration_seconds: number | null;
  sentiment_split: Record<string, number>;
  top_keywords: { keyword: string; count: number }[];
  total_action_items: number;
  last_updated: string | null;
}

export type CallStatus = "pending" | "processing" | "completed" | "failed";
export type Sentiment = "positive" | "neutral" | "negative";

export interface CallListItem {
  id?: string;
  _id?: string;
  file_name: string;
  agent_name: string;
  customer_name: string;
  duration_seconds?: number | null;
  overall_score?: number | null;
  sentiment?: Sentiment | null;
  review_status?: "pending" | "done";
  status: CallStatus;
  processed_at?: string | null;
}

export interface TalkTime {
  agent_percent: number;
  customer_percent: number;
}

export interface AgentScores {
  communication_clarity: number;
  politeness: number;
  business_knowledge: number;
  problem_handling: number;
  listening_ability: number;
}

export interface QuestionnaireCoverageRow {
  question_id: string;
  question: string;
  asked: boolean;
}

export interface ObservationItem {
  observation: string;
  evidence: string;
  quote: string;
  coaching_tip: string;
}

export interface CallDetail {
  id?: string;
  _id?: string;
  file_name: string;
  agent_name: string;
  customer_name: string;
  duration_seconds?: number | null;
  transcript?: string | null;
  summary?: string | null;
  sentiment?: Sentiment | null;
  overall_score?: number | null;
  talk_time?: TalkTime | null;
  agent_scores?: AgentScores | null;
  keywords?: string[];
  action_items?: string[];
  questionnaire_coverage?: QuestionnaireCoverageRow[];
  positive_observations?: ObservationItem[];
  negative_observations?: ObservationItem[];
  processed_at?: string | null;
  status?: CallStatus;
}

export interface CallLogRow {
  id?: string;
  call_id?: string;
  file_name?: string;
  stage?: string;
  status?: string;
  message?: string;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_API_URL ?? "";
  return u.replace(/\/$/, "");
}

export function getCallId(item: { id?: string; _id?: string }): string {
  return item.id ?? item._id ?? "";
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const url = `${baseUrl()}/api/dashboard/stats`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("getDashboardStats failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await safeJson<DashboardStats>(res);
    return data;
  } catch (e) {
    console.error("getDashboardStats error", e);
    return null;
  }
}

export async function getAllCalls(): Promise<CallListItem[] | null> {
  const url = `${baseUrl()}/api/calls`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("getAllCalls failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await safeJson<CallListItem[]>(res);
    return Array.isArray(data) ? data : null;
  } catch (e) {
    console.error("getAllCalls error", e);
    return null;
  }
}

export async function getCallById(id: string): Promise<CallDetail | null> {
  const url = `${baseUrl()}/api/calls/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("getCallById failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    return await safeJson<CallDetail>(res);
  } catch (e) {
    console.error("getCallById error", e);
    return null;
  }
}

export async function getCallLogs(id: string): Promise<CallLogRow[] | null> {
  const url = `${baseUrl()}/api/calls/${encodeURIComponent(id)}/logs`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("getCallLogs failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await safeJson<CallLogRow[]>(res);
    return Array.isArray(data) ? data : null;
  } catch (e) {
    console.error("getCallLogs error", e);
    return null;
  }
}

export async function triggerProcessing(): Promise<{ message?: string } | null> {
  const url = `${baseUrl()}/api/queue/process`;
  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    if (!res.ok) {
      console.error("triggerProcessing failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    return await safeJson<{ message?: string }>(res);
  } catch (e) {
    console.error("triggerProcessing error", e);
    return null;
  }
}

export async function updateReviewStatus(
  id: string,
  review_status: "pending" | "done",
): Promise<boolean> {
  const url = `${baseUrl()}/api/calls/${encodeURIComponent(id)}/review`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ review_status }),
    });
    if (!res.ok) {
      console.error("updateReviewStatus failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("updateReviewStatus error", e);
    return false;
  }
}
