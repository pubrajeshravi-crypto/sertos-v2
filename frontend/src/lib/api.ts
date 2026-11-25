import { MockApiError, mockRequest } from "../mocks/mockApi";

// Prefer same-origin requests. Vite proxies /api locally and Vercel forwards
// /api to the configured backend, so a browser never tries its own localhost.
export const MOCK_MODE = import.meta.env.VITE_USE_MOCKS === "true";
const configuredApiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const pointsToLocalMachine = /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(configuredApiBaseUrl);
// A stale localhost build variable is common when moving a Vite build to
// Vercel. Browsers would otherwise send requests to each visitor's computer
// and never reach the configured same-origin /api rewrite.
const API_BASE_URL = import.meta.env.PROD && pointsToLocalMachine ? "" : configuredApiBaseUrl;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
};

export type LoginData = {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    role: string;
    is_verified: boolean;
  };
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  canRefresh = true,
): Promise<T> {
  if (MOCK_MODE) {
    try {
      return await mockRequest<T>(path, options);
    } catch (reason) {
      if (reason instanceof MockApiError) {
        throw new ApiError(reason.message, reason.status);
      }
      throw reason;
    }
  }

  const accessToken = localStorage.getItem("sertos_access_token");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch (reason) {
    const target = API_BASE_URL || (typeof window === "undefined" ? "this site" : window.location.origin);
    throw new ApiError(
      `Could not reach the SERTOS API at ${target}. Check the API service, deployment URL, and CORS settings.${reason instanceof Error && reason.message ? ` (${reason.message})` : ""}`,
      0,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    const responseType = response.headers.get("content-type") ?? "a non-JSON response";
    const unavailable = response.status === 502 || response.status === 503 || response.status === 504;
    throw new ApiError(
      `The SERTOS API returned HTTP ${response.status} as ${responseType}.${unavailable ? " The API service may be starting or unavailable." : " Check the backend response format."}`,
      response.status,
    );
  }

  if (
    response.status === 401 &&
    canRefresh &&
    path !== "/api/auth/token/refresh/"
  ) {
    const refreshToken = localStorage.getItem("sertos_refresh_token");
    if (refreshToken) {
      try {
        const refreshed = await request<LoginRefresh>(
          "/api/auth/token/refresh/",
          {
            method: "POST",
            body: JSON.stringify({ refresh: refreshToken }),
          },
          false,
        );
        localStorage.setItem("sertos_access_token", refreshed.access);
        if (refreshed.refresh) {
          localStorage.setItem("sertos_refresh_token", refreshed.refresh);
        }
        return request<T>(path, options, false);
      } catch {
        localStorage.removeItem("sertos_access_token");
        localStorage.removeItem("sertos_refresh_token");
      }
    }
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
  const envelope = isRecord(payload) && "success" in payload && "data" in payload
    ? payload as ApiEnvelope<T>
    : undefined;
  const errors = envelope?.errors ?? (isRecord(payload) ? payload : undefined);
  const firstFieldError = Object.values(errors ?? {}).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  ).find((value): value is string => typeof value === "string");
  const detail = (Array.isArray(errors?.detail) ? errors.detail[0] : undefined)
    ?? (isRecord(payload) && typeof payload.detail === "string" ? payload.detail : undefined)
    ?? (isRecord(payload) && Array.isArray(payload.detail) && typeof payload.detail[0] === "string" ? payload.detail[0] : undefined)
    ?? firstFieldError;
  const message = envelope?.message
    ?? (isRecord(payload) && typeof payload.message === "string" ? payload.message : undefined);
  if (!response.ok || envelope?.success === false) {
    throw new ApiError(
      detail ?? message ?? "The request could not be completed.",
      response.status,
    );
  }

  return envelope ? envelope.data : payload as T;
}

export function login(username: string, password: string) {
  return request<LoginData>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export type LoginRefresh = {
  access: string;
  refresh?: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  phone_number: string;
  badge_or_employee_id: string;
  age: number | null;
  is_verified: boolean;
  date_joined: string;
  first_name?: string;
  last_name?: string;
};

export type Incident = {
  id: string;
  incident_number: string;
  severity: string;
  severity_display: string;
  status: string;
  status_display: string;
  description: string;
  patient_count: number;
  hospital_decision?: "ACCEPTED" | "REJECTED" | null;
  police_acknowledged?: boolean;
  hospital?: {
    id: string;
    name: string;
    address: string;
  };
  hospital_name?: string;
  hospital_code?: string;
  ambulance?: {
    vehicle_number: string;
  };
  ambulance_vehicle_number?: string;
  created_at: string;
  updated_at: string;
  assigned_at?: string | null;
  in_transit_at?: string | null;
  arrived_at?: string | null;
  closed_at?: string | null;
  cancelled_at?: string | null;
};

export type Hospital = {
  id: string;
  name: string;
  hospital_code: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
};

export type RouteSummary = {
  distance_km: number;
  duration_formatted: string;
  estimated_arrival: string;
  polyline?: string;
};

export type IncidentLocation = {
  latitude: string;
  longitude: string;
  recorded_at: string;
};

function parseIncidentLocation(value: unknown): IncidentLocation | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const latitudeValue = record.latitude;
  const longitudeValue = record.longitude;
  const recordedAt = record.recorded_at;
  const hasCoordinate = (coordinate: unknown) =>
    typeof coordinate === "number" ||
    (typeof coordinate === "string" && coordinate.trim() !== "");

  if (
    !hasCoordinate(latitudeValue) ||
    !hasCoordinate(longitudeValue) ||
    typeof recordedAt !== "string" ||
    !recordedAt.trim()
  ) {
    return null;
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(Date.parse(recordedAt))
  ) {
    return null;
  }

  return {
    latitude: String(latitude),
    longitude: String(longitude),
    recorded_at: recordedAt,
  };
}

export type HospitalBed = {
  id: string;
  hospital: string;
  bed_number: string;
  category: "GENERAL" | "ICU" | "EMERGENCY";
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  patient_label: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  incident_id: string;
  incident_number: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type NotificationsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
};

export type TrafficDeviceOverview = {
  id: string;
  device_id: string;
  name: string;
  intersection_name: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  last_heartbeat_at: string | null;
  current_signal_phase: string;
  firmware_version: string;
  sensor_1_detected: boolean | null;
  sensor_2_detected: boolean | null;
  latest_signal_state: {
    current_phase: string;
    is_preempted: boolean;
    reported_at: string;
  } | null;
};

export type TrafficDeviceRecord = {
  id: string;
  device_id: string;
  name: string;
  intersection_name: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  last_heartbeat_at: string | null;
  current_signal_phase: string;
  firmware_version: string;
  ip_address: string | null;
  mac_address: string;
  created_at: string;
  updated_at: string;
};

export type TrafficDeviceRegistration = TrafficDeviceRecord & {
  raw_token: string;
  raw_token_warning: string;
};

export type TrafficCommand = {
  id: string;
  device_id: string;
  incident_id: string;
  incident_number: string;
  action: string;
  status: string;
  created_at: string;
  expires_at: string;
  acknowledged_at: string | null;
  executed_at: string | null;
  execution_notes: string;
  failure_reason: string;
  distance_meters_at_creation: number | null;
  eta_seconds_at_creation: number | null;
};

export type PoliceTrafficOverview = {
  devices: TrafficDeviceOverview[];
  commands: TrafficCommand[];
};

export const api = {
  getProfile: () =>
    request<UserProfile>("/api/auth/profile/"),
  updateProfile: (payload: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    age: number;
    phone_number: string;
    badge_or_employee_id: string;
  }>) =>
    request<UserProfile>("/api/auth/profile/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getPoliceIncidents: () =>
    request<Incident[]>("/api/police/incidents/"),
  getHospitalIncidents: () =>
    request<Incident[]>("/api/hospital/incidents/"),
  getDriverIncidents: () =>
    request<Incident[]>("/api/emergencies/"),
  getHospitals: () =>
    request<Hospital[]>("/api/emergencies/hospitals/"),
  createEmergency: (payload: {
    hospital_id: string;
    severity: string;
    description: string;
    patient: { name: string; medical_notes: string };
  }) =>
    request<Incident>("/api/emergencies/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIncidentStatus: (incidentId: string, status: string) =>
    request<Incident>(`/api/emergencies/${incidentId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  sendLocation: (incidentId: string, latitude: number, longitude: number) =>
    request(`/api/emergencies/${incidentId}/location/`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),
  getRoute: (incidentId: string) =>
    request<RouteSummary>(`/api/emergencies/${incidentId}/route/`),
  getHospitalBeds: () =>
    request<HospitalBed[]>("/api/emergencies/hospital-beds/"),
  updateHospitalBed: (bedId: string, payload: Partial<Pick<HospitalBed, "status" | "patient_label">>) =>
    request<HospitalBed>(`/api/emergencies/hospital-beds/${bedId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createHospitalBed: (payload: {
    bed_number: string;
    category: "GENERAL" | "ICU" | "EMERGENCY";
    status?: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  }) =>
    request<HospitalBed>("/api/emergencies/hospital-beds/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  decideHospitalIncident: (incidentId: string, decision: "ACCEPTED" | "REJECTED", reason = "") =>
    request("/api/emergencies/hospital/incidents/" + incidentId + "/decision/", {
      method: "PATCH",
      body: JSON.stringify({ decision, reason }),
    }),
  acknowledgePoliceIncident: (incidentId: string) =>
    request<{ incident_id: string; acknowledged: boolean; acknowledged_at: string }>(
      `/api/police/incidents/${incidentId}/acknowledge/`,
      { method: "POST" },
    ),
  getNotifications: () =>
    request<NotificationsPage>("/api/notifications/"),
  getPoliceTrafficOverview: () =>
    request<PoliceTrafficOverview>("/api/traffic/police/overview/"),
  recheckTrafficCorridor: (incidentId: string) =>
    request<{ created_count: number; commands: TrafficCommand[] }>(`/api/traffic/police/incidents/${incidentId}/recheck-corridor/`, {
      method: "POST",
    }),
  getTrafficDevices: () =>
    request<TrafficDeviceRecord[]>("/api/traffic/devices/"),
  registerTrafficDevice: (payload: {
    device_id: string;
    name: string;
    intersection_name: string;
    latitude: number;
    longitude: number;
  }) =>
    request<TrafficDeviceRegistration>("/api/traffic/devices/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  markAllNotificationsRead: () =>
    request<{ updated_count: number }>("/api/notifications/read-all/", {
      method: "PATCH",
    }),
  getLocation: async (incidentId: string) => {
    const location = await request<unknown>(`/api/emergencies/${incidentId}/location/`);
    return parseIncidentLocation(location);
  },
  logout: (refresh: string) =>
    request("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),
};
