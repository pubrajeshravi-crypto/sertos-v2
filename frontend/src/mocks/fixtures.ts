import type {
  Hospital,
  HospitalBed,
  Incident,
  IncidentLocation,
  LoginData,
  Notification,
  PoliceTrafficOverview,
  TrafficDeviceRecord,
  UserProfile,
} from "../lib/api";

export const DEMO_PASSWORD = "SertosDemo!2026";

export const DEMO_ACCOUNTS: Array<{
  username: string;
  role: LoginData["user"]["role"];
  label: string;
}> = [
  { username: "demo_driver", role: "AMBULANCE_DRIVER", label: "Ambulance Driver" },
  { username: "demo_police", role: "POLICE_DISPATCHER", label: "Police Dispatch" },
  { username: "demo_hospital", role: "HOSPITAL_STAFF", label: "Hospital Staff" },
  { username: "demo_admin", role: "ADMIN", label: "System Admin" },
];

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const incidentId = "d3e6e9a1-7593-4f2e-8e27-47e1e6e12501";
const hospitalId = "da6dc893-98a6-45a3-b87b-ef553493e2b2";

export const DEMO_PROFILES: Record<string, UserProfile> = {
  demo_driver: {
    id: 101,
    username: "demo_driver",
    email: "driver@example.test",
    role: "AMBULANCE_DRIVER",
    phone_number: "+1 555 0101",
    badge_or_employee_id: "AMB-204",
    age: 34,
    is_verified: true,
    date_joined: minutesAgo(60 * 24 * 30),
    first_name: "Alex",
    last_name: "Morgan",
  },
  demo_police: {
    id: 102,
    username: "demo_police",
    email: "police@example.test",
    role: "POLICE_DISPATCHER",
    phone_number: "+1 555 0102",
    badge_or_employee_id: "PD-018",
    age: 38,
    is_verified: true,
    date_joined: minutesAgo(60 * 24 * 30),
    first_name: "Jordan",
    last_name: "Reed",
  },
  demo_hospital: {
    id: 103,
    username: "demo_hospital",
    email: "hospital@example.test",
    role: "HOSPITAL_STAFF",
    phone_number: "+1 555 0103",
    badge_or_employee_id: "HSP-042",
    age: 41,
    is_verified: true,
    date_joined: minutesAgo(60 * 24 * 30),
    first_name: "Taylor",
    last_name: "Kim",
  },
  demo_admin: {
    id: 104,
    username: "demo_admin",
    email: "admin@example.test",
    role: "ADMIN",
    phone_number: "+1 555 0104",
    badge_or_employee_id: "SYS-001",
    age: 45,
    is_verified: true,
    date_joined: minutesAgo(60 * 24 * 30),
    first_name: "Casey",
    last_name: "Parker",
  },
};

export const DEMO_HOSPITALS: Hospital[] = [
  {
    id: hospitalId,
    name: "Central City Medical Center",
    hospital_code: "CCMC-01",
    address: "1200 Central Avenue",
    latitude: "17.3850",
    longitude: "78.4867",
    is_active: true,
  },
  {
    id: "c2d77f25-4331-46cf-965f-4e31ea3327e3",
    name: "Riverside Emergency Hospital",
    hospital_code: "REH-02",
    address: "88 Riverside Road",
    latitude: "17.4120",
    longitude: "78.4520",
    is_active: true,
  },
];

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: incidentId,
    incident_number: "SRT-DEMO-204",
    severity: "HIGH",
    severity_display: "High",
    status: "IN_TRANSIT",
    status_display: "In Transit",
    description: "Demo response: urgent medical assistance required.",
    patient_count: 1,
    hospital_decision: "ACCEPTED",
    police_acknowledged: true,
    hospital: {
      id: hospitalId,
      name: "Central City Medical Center",
      address: "1200 Central Avenue",
    },
    hospital_name: "Central City Medical Center",
    hospital_code: "CCMC-01",
    ambulance: { vehicle_number: "AMB-204" },
    ambulance_vehicle_number: "AMB-204",
    created_at: minutesAgo(18),
    updated_at: minutesAgo(1),
    assigned_at: minutesAgo(16),
    in_transit_at: minutesAgo(8),
  },
  {
    id: "4e2a5ab6-2c2d-4c79-8f72-1172ee416502",
    incident_number: "SRT-DEMO-205",
    severity: "CRITICAL",
    severity_display: "Critical",
    status: "REPORTED",
    status_display: "Reported",
    description: "Demo response awaiting hospital triage.",
    patient_count: 1,
    hospital_decision: null,
    police_acknowledged: false,
    hospital: {
      id: hospitalId,
      name: "Central City Medical Center",
      address: "1200 Central Avenue",
    },
    hospital_name: "Central City Medical Center",
    hospital_code: "CCMC-01",
    ambulance: { vehicle_number: "AMB-305" },
    ambulance_vehicle_number: "AMB-305",
    created_at: minutesAgo(3),
    updated_at: minutesAgo(3),
    assigned_at: null,
    in_transit_at: null,
  },
];

export const DEMO_LOCATION: IncidentLocation = {
  latitude: "17.3879",
  longitude: "78.4790",
  recorded_at: minutesAgo(1),
};

export const DEMO_HOSPITAL_BEDS: HospitalBed[] = [
  {
    id: "84b3a136-1e9d-4c43-86bd-c4e741998b01",
    hospital: hospitalId,
    bed_number: "ER-01",
    category: "EMERGENCY",
    status: "AVAILABLE",
    patient_label: "",
    updated_at: minutesAgo(4),
  },
  {
    id: "84b3a136-1e9d-4c43-86bd-c4e741998b02",
    hospital: hospitalId,
    bed_number: "ICU-03",
    category: "ICU",
    status: "OCCUPIED",
    patient_label: "Patient 204",
    updated_at: minutesAgo(12),
  },
  {
    id: "84b3a136-1e9d-4c43-86bd-c4e741998b03",
    hospital: hospitalId,
    bed_number: "GEN-08",
    category: "GENERAL",
    status: "AVAILABLE",
    patient_label: "",
    updated_at: minutesAgo(20),
  },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "b83cfe92-f8ae-4813-b186-19e4f40af101",
    incident_id: incidentId,
    incident_number: "SRT-DEMO-204",
    title: "Ambulance en route",
    message: "AMB-204 is travelling to Central City Medical Center.",
    is_read: false,
    created_at: minutesAgo(2),
    read_at: null,
  },
  {
    id: "b83cfe92-f8ae-4813-b186-19e4f40af102",
    incident_id: incidentId,
    incident_number: "SRT-DEMO-204",
    title: "Police coordination acknowledged",
    message: "Dispatch acknowledged the active emergency.",
    is_read: true,
    created_at: minutesAgo(7),
    read_at: minutesAgo(6),
  },
];

const demoDevice: TrafficDeviceRecord = {
  id: "d3993ca2-bd11-485e-a101-d41c4a0f4101",
  device_id: "JUNCTION-DEMO-01",
  name: "Central Avenue Controller",
  intersection_name: "CENTRAL AVE & 4TH ST",
  latitude: "17.3890",
  longitude: "78.4820",
  is_active: true,
  last_heartbeat_at: minutesAgo(1),
  current_signal_phase: "NORTH_SOUTH_GREEN",
  firmware_version: "demo-1.0",
  ip_address: null,
  mac_address: "00:00:5E:00:53:01",
  created_at: minutesAgo(60 * 24),
  updated_at: minutesAgo(1),
};

export const DEMO_TRAFFIC: PoliceTrafficOverview = {
  devices: [
    {
      id: demoDevice.id,
      device_id: demoDevice.device_id,
      name: demoDevice.name,
      intersection_name: demoDevice.intersection_name,
      latitude: demoDevice.latitude,
      longitude: demoDevice.longitude,
      is_active: demoDevice.is_active,
      last_heartbeat_at: demoDevice.last_heartbeat_at,
      current_signal_phase: demoDevice.current_signal_phase,
      firmware_version: demoDevice.firmware_version,
      sensor_1_detected: false,
      sensor_2_detected: false,
      latest_signal_state: {
        current_phase: demoDevice.current_signal_phase,
        is_preempted: false,
        reported_at: minutesAgo(1),
      },
    },
  ],
  commands: [
    {
      id: "c5f8b86c-f5a4-4f92-9b46-c44145e9c901",
      device_id: demoDevice.device_id,
      incident_id: incidentId,
      incident_number: "SRT-DEMO-204",
      action: "PREEMPT",
      status: "PENDING",
      created_at: minutesAgo(1),
      expires_at: new Date(now + 4 * 60_000).toISOString(),
      acknowledged_at: null,
      executed_at: null,
      execution_notes: "",
      failure_reason: "",
      distance_meters_at_creation: 420,
      eta_seconds_at_creation: 180,
    },
  ],
};

export const DEMO_ROUTE = {
  distance_km: 4.2,
  duration_formatted: "11 min",
  estimated_arrival: new Date(now + 11 * 60_000).toISOString(),
};
