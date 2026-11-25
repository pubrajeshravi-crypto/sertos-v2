import type {
  HospitalBed,
  Incident,
  IncidentLocation,
  LoginData,
  LoginRefresh,
  NotificationsPage,
  PoliceTrafficOverview,
  RouteSummary,
  TrafficCommand,
  TrafficDeviceRecord,
  TrafficDeviceRegistration,
  UserProfile,
} from "../lib/api";
import {
  DEMO_ACCOUNTS,
  DEMO_HOSPITALS,
  DEMO_HOSPITAL_BEDS,
  DEMO_INCIDENTS,
  DEMO_LOCATION,
  DEMO_NOTIFICATIONS,
  DEMO_PASSWORD,
  DEMO_PROFILES,
  DEMO_ROUTE,
  DEMO_TRAFFIC,
} from "./fixtures";

export class MockApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const incidents = clone(DEMO_INCIDENTS);
const hospitals = clone(DEMO_HOSPITALS);
const beds = clone(DEMO_HOSPITAL_BEDS);
const notifications = clone(DEMO_NOTIFICATIONS);
const traffic: PoliceTrafficOverview = clone(DEMO_TRAFFIC);
const devices: TrafficDeviceRecord[] = [
  {
    id: traffic.devices[0].id,
    device_id: traffic.devices[0].device_id,
    name: traffic.devices[0].name,
    intersection_name: traffic.devices[0].intersection_name,
    latitude: traffic.devices[0].latitude,
    longitude: traffic.devices[0].longitude,
    is_active: traffic.devices[0].is_active,
    last_heartbeat_at: traffic.devices[0].last_heartbeat_at,
    current_signal_phase: traffic.devices[0].current_signal_phase,
    firmware_version: traffic.devices[0].firmware_version,
    ip_address: null,
    mac_address: "00:00:5E:00:53:01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
const locations = new Map<string, IncidentLocation>([
  [DEMO_INCIDENTS[0].id, clone(DEMO_LOCATION)],
]);
const profileUpdates = new Map<string, Partial<UserProfile>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBody(options: RequestInit): Record<string, unknown> {
  if (typeof options.body !== "string") return {};
  try {
    const body: unknown = JSON.parse(options.body);
    if (!isRecord(body)) throw new MockApiError("Request body must be an object.", 400);
    return body;
  } catch (reason) {
    if (reason instanceof MockApiError) throw reason;
    throw new MockApiError("Request body must contain valid JSON.", 400);
  }
}

function accountForAccessToken(): (typeof DEMO_ACCOUNTS)[number] | undefined {
  const token = localStorage.getItem("sertos_access_token");
  return DEMO_ACCOUNTS.find((account) => token === `demo-access-${account.role}`);
}

function profileForAccount(account: (typeof DEMO_ACCOUNTS)[number]): UserProfile {
  return {
    ...DEMO_PROFILES[account.username],
    ...profileUpdates.get(account.username),
  };
}

function incidentById(incidentId: string): Incident {
  const incident = incidents.find((item) => item.id === incidentId);
  if (!incident) throw new MockApiError("Incident not found in demo data.", 404);
  return incident;
}

function statusDisplay(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requireNumber(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new MockApiError(`${field} must be a number.`, 400);
  return number;
}

function updateBed(bedId: string, patch: Partial<Pick<HospitalBed, "status" | "patient_label">>): HospitalBed {
  const index = beds.findIndex((bed) => bed.id === bedId);
  if (index < 0) throw new MockApiError("Hospital bed not found in demo data.", 404);
  beds[index] = { ...beds[index], ...patch, updated_at: new Date().toISOString() };
  return beds[index];
}

export async function mockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const body = readBody(options);
  let result: unknown;

  if (path === "/api/auth/login/" && method === "POST") {
    const enteredUsername = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const username = enteredUsername.replace(/\./g, "_");
    const password = typeof body.password === "string" ? body.password : "";
    const account = DEMO_ACCOUNTS.find((item) =>
      item.username.toLowerCase() === username
      || DEMO_PROFILES[item.username].email.toLowerCase() === enteredUsername,
    );
    if (!account || password !== DEMO_PASSWORD) {
      throw new MockApiError("Invalid demo credentials. Choose a demo role and use the password shown.", 401);
    }
    const user = DEMO_PROFILES[account.username];
    result = {
      access: `demo-access-${account.role}`,
      refresh: `demo-refresh-${account.role}`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_verified: user.is_verified,
      },
    } satisfies LoginData;
  } else if (path === "/api/auth/token/refresh/" && method === "POST") {
    const account = DEMO_ACCOUNTS.find((item) => body.refresh === `demo-refresh-${item.role}`);
    if (!account) throw new MockApiError("Demo session expired. Please sign in again.", 401);
    result = { access: `demo-access-${account.role}`, refresh: `demo-refresh-${account.role}` } satisfies LoginRefresh;
  } else if (path === "/api/auth/profile/" && method === "GET") {
    const account = accountForAccessToken();
    if (!account) throw new MockApiError("Sign in to load a demo profile.", 401);
    result = profileForAccount(account);
  } else if (path === "/api/auth/profile/" && method === "PATCH") {
    const account = accountForAccessToken();
    if (!account) throw new MockApiError("Sign in to update a demo profile.", 401);
    const updates = Object.fromEntries(
      Object.entries(body).filter(([, value]) => typeof value === "string" || typeof value === "number"),
    ) as Partial<UserProfile>;
    profileUpdates.set(account.username, { ...profileUpdates.get(account.username), ...updates });
    result = profileForAccount(account);
  } else if (path === "/api/auth/logout/" && method === "POST") {
    result = {};
  } else if (path === "/api/police/incidents/" && method === "GET") {
    result = incidents;
  } else if (path === "/api/hospital/incidents/" && method === "GET") {
    result = incidents;
  } else if (path === "/api/emergencies/" && method === "GET") {
    result = incidents;
  } else if (path === "/api/emergencies/" && method === "POST") {
    const hospitalId = typeof body.hospital_id === "string" ? body.hospital_id : "";
    const hospital = hospitals.find((item) => item.id === hospitalId);
    if (!hospital) throw new MockApiError("Select an available demo hospital.", 400);
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) throw new MockApiError("A patient report is required.", 400);
    const incident: Incident = {
      id: makeId(),
      incident_number: `SRT-DEMO-${String(incidents.length + 205).padStart(3, "0")}`,
      severity: typeof body.severity === "string" ? body.severity : "HIGH",
      severity_display: statusDisplay(typeof body.severity === "string" ? body.severity : "HIGH"),
      status: "REPORTED",
      status_display: "Reported",
      description,
      patient_count: 1,
      hospital_decision: null,
      police_acknowledged: false,
      hospital: { id: hospital.id, name: hospital.name, address: hospital.address },
      hospital_name: hospital.name,
      hospital_code: hospital.hospital_code,
      ambulance: { vehicle_number: "AMB-204" },
      ambulance_vehicle_number: "AMB-204",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_at: null,
      in_transit_at: null,
    };
    incidents.unshift(incident);
    result = incident;
  } else if (/^\/api\/emergencies\/[^/]+\/status\/$/.test(path) && method === "PATCH") {
    const incidentId = path.split("/")[3];
    const incident = incidentById(incidentId);
    const status = typeof body.status === "string" ? body.status : "";
    if (!status) throw new MockApiError("An incident status is required.", 400);
    incident.status = status;
    incident.status_display = statusDisplay(status);
    incident.updated_at = new Date().toISOString();
    if (status === "ASSIGNED") incident.assigned_at = incident.updated_at;
    if (status === "IN_TRANSIT") incident.in_transit_at = incident.updated_at;
    result = incident;
  } else if (/^\/api\/emergencies\/[^/]+\/location\/$/.test(path) && method === "POST") {
    const incidentId = path.split("/")[3];
    incidentById(incidentId);
    const latitude = requireNumber(body.latitude, "latitude");
    const longitude = requireNumber(body.longitude, "longitude");
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new MockApiError("Coordinates are outside the valid range.", 400);
    }
    const location: IncidentLocation = {
      latitude: String(latitude),
      longitude: String(longitude),
      recorded_at: new Date().toISOString(),
    };
    locations.set(incidentId, location);
    result = location;
  } else if (/^\/api\/emergencies\/[^/]+\/location\/$/.test(path) && method === "GET") {
    const incidentId = path.split("/")[3];
    incidentById(incidentId);
    const location = locations.get(incidentId);
    if (!location) {
      result = {};
    } else {
      location.recorded_at = new Date().toISOString();
      result = location;
    }
  } else if (/^\/api\/emergencies\/[^/]+\/route\/$/.test(path) && method === "GET") {
    incidentById(path.split("/")[3]);
    result = {
      ...DEMO_ROUTE,
      estimated_arrival: new Date(Date.now() + 11 * 60_000).toISOString(),
    } satisfies RouteSummary;
  } else if (path === "/api/emergencies/hospitals/" && method === "GET") {
    result = hospitals.filter((hospital) => hospital.is_active);
  } else if (path === "/api/emergencies/hospital-beds/" && method === "GET") {
    result = beds;
  } else if (path === "/api/emergencies/hospital-beds/" && method === "POST") {
    const bedNumber = typeof body.bed_number === "string" ? body.bed_number.trim() : "";
    const category = body.category;
    if (!bedNumber || !["GENERAL", "ICU", "EMERGENCY"].includes(String(category))) {
      throw new MockApiError("Provide a bed number and valid category.", 400);
    }
    const bed: HospitalBed = {
      id: makeId(),
      hospital: hospitals[0].id,
      bed_number: bedNumber,
      category: category as HospitalBed["category"],
      status: ["AVAILABLE", "OCCUPIED", "RESERVED"].includes(String(body.status))
        ? body.status as HospitalBed["status"]
        : "AVAILABLE",
      patient_label: "",
      updated_at: new Date().toISOString(),
    };
    beds.push(bed);
    result = bed;
  } else if (/^\/api\/emergencies\/hospital-beds\/[^/]+\/$/.test(path) && method === "PATCH") {
    const bedId = path.split("/")[4];
    const patch: Partial<Pick<HospitalBed, "status" | "patient_label">> = {};
    if (["AVAILABLE", "OCCUPIED", "RESERVED"].includes(String(body.status))) {
      patch.status = body.status as HospitalBed["status"];
    }
    if (typeof body.patient_label === "string") patch.patient_label = body.patient_label;
    result = updateBed(bedId, patch);
  } else if (/^\/api\/emergencies\/hospital\/incidents\/[^/]+\/decision\/$/.test(path) && method === "PATCH") {
    const incidentId = path.split("/")[5];
    const incident = incidentById(incidentId);
    if (body.decision !== "ACCEPTED" && body.decision !== "REJECTED") {
      throw new MockApiError("Choose ACCEPTED or REJECTED.", 400);
    }
    incident.hospital_decision = body.decision;
    incident.updated_at = new Date().toISOString();
    result = {};
  } else if (/^\/api\/police\/incidents\/[^/]+\/acknowledge\/$/.test(path) && method === "POST") {
    const incidentId = path.split("/")[4];
    const incident = incidentById(incidentId);
    const acknowledgedAt = new Date().toISOString();
    incident.police_acknowledged = true;
    incident.updated_at = acknowledgedAt;
    result = { incident_id: incidentId, acknowledged: true, acknowledged_at: acknowledgedAt };
  } else if (path === "/api/notifications/" && method === "GET") {
    const page: NotificationsPage = { count: notifications.length, next: null, previous: null, results: notifications };
    result = page;
  } else if (path === "/api/notifications/read-all/" && method === "PATCH") {
    const unread = notifications.filter((notification) => !notification.is_read);
    const readAt = new Date().toISOString();
    unread.forEach((notification) => {
      notification.is_read = true;
      notification.read_at = readAt;
    });
    result = { updated_count: unread.length };
  } else if (path === "/api/traffic/police/overview/" && method === "GET") {
    const reportedAt = new Date().toISOString();
    traffic.devices.forEach((device) => {
      if (!device.is_active) return;
      device.last_heartbeat_at = reportedAt;
      if (device.latest_signal_state) device.latest_signal_state.reported_at = reportedAt;
    });
    result = traffic;
  } else if (/^\/api\/traffic\/police\/incidents\/[^/]+\/recheck-corridor\/$/.test(path) && method === "POST") {
    const incident = incidentById(path.split("/")[5]);
    const newCommands: TrafficCommand[] = traffic.devices.map((device) => ({
      id: makeId(),
      device_id: device.device_id,
      incident_id: incident.id,
      incident_number: incident.incident_number,
      action: "PREEMPT",
      status: "PENDING",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 60_000).toISOString(),
      acknowledged_at: null,
      executed_at: null,
      execution_notes: "",
      failure_reason: "",
      distance_meters_at_creation: null,
      eta_seconds_at_creation: null,
    }));
    traffic.commands.unshift(...newCommands);
    result = { created_count: newCommands.length, commands: newCommands };
  } else if (path === "/api/traffic/devices/" && method === "GET") {
    result = devices;
  } else if (path === "/api/traffic/devices/register/" && method === "POST") {
    const deviceId = typeof body.device_id === "string" ? body.device_id.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const intersectionName = typeof body.intersection_name === "string" ? body.intersection_name.trim() : "";
    if (!deviceId || !name || !intersectionName) {
      throw new MockApiError("Device ID, name, and intersection are required.", 400);
    }
    const timestamp = new Date().toISOString();
    const device: TrafficDeviceRegistration = {
      id: makeId(),
      device_id: deviceId,
      name,
      intersection_name: intersectionName,
      latitude: String(requireNumber(body.latitude, "latitude")),
      longitude: String(requireNumber(body.longitude, "longitude")),
      is_active: true,
      last_heartbeat_at: null,
      current_signal_phase: "UNKNOWN",
      firmware_version: "demo-1.0",
      ip_address: null,
      mac_address: "00:00:5E:00:53:02",
      created_at: timestamp,
      updated_at: timestamp,
      raw_token: `demo-token-${makeId()}`,
      raw_token_warning: "Demo token only; it is not valid for a live controller.",
    };
    devices.push(device);
    result = device;
  } else {
    throw new MockApiError(`No demo handler is configured for ${method} ${path}.`, 404);
  }

  return result as T;
}
