import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    Ambulance,
    Building2,
    Cpu,
    LogOut,
    RefreshCw,
    ShieldCheck,
    Users,
} from "lucide-react";
import { api, type Incident, type Hospital, type TrafficDeviceRecord } from "../../lib/api";
import { clearSession, getSession } from "../../lib/auth";
import { useLiveQuery } from "../../lib/useLiveQuery";
import "../hospital/hospital.css";

type AdminOverview = {
    incidents: Incident[];
    hospitals: Hospital[];
    devices: TrafficDeviceRecord[];
};

function isRecentlyReporting(device: TrafficDeviceRecord) {
    if (!device.is_active || !device.last_heartbeat_at) return false;
    const age = Date.now() - Date.parse(device.last_heartbeat_at);
    return Number.isFinite(age) && age >= 0 && age < 90_000;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const loadOverview = useCallback(async (): Promise<AdminOverview> => {
        const [incidents, hospitals, devices] = await Promise.all([
            api.getDriverIncidents(),
            api.getHospitals(),
            api.getTrafficDevices(),
        ]);
        return { incidents, hospitals, devices };
    }, []);
    const { data, loading, error, lastUpdated, refresh } = useLiveQuery(loadOverview, 10_000);

    const incidents = data?.incidents ?? [];
    const activeIncidents = incidents.filter(
        (incident) => !["CLOSED", "CANCELLED"].includes(incident.status),
    );
    const enRouteAmbulances = new Set(
        incidents
            .filter((incident) => incident.status === "IN_TRANSIT")
            .map((incident) => incident.ambulance_vehicle_number || incident.ambulance?.vehicle_number)
            .filter((vehicle): vehicle is string => Boolean(vehicle)),
    ).size;
    const reportingDevices = (data?.devices ?? []).filter(isRecentlyReporting).length;

    const logout = async () => {
        const refreshToken = getSession()?.refresh;
        if (refreshToken) {
            try {
                await api.logout(refreshToken);
            } catch {
                // Local cleanup remains effective even if the backend is unavailable.
            }
        }
        clearSession();
        navigate("/", { replace: true });
    };

    const cards = [
        { label: "Active Emergencies", value: activeIncidents.length, icon: Activity },
        { label: "Ambulances En Route", value: enRouteAmbulances, icon: Ambulance },
        { label: "Active Hospitals", value: data?.hospitals.length ?? "—", icon: Building2 },
        { label: "Controllers Reporting", value: `${reportingDevices} / ${data?.devices.length ?? "—"}`, icon: Cpu },
    ];

    return (
        <main className="hd-dashboard">
            <div className="hd-page-header">
                <div>
                    <div className="hd-breadcrumb">SERTOS / Administrator</div>
                    <h1>System Overview</h1>
                    <p>Live emergency, hospital, and controller data from the SERTOS API.</p>
                </div>
                <div className="ad-header-actions">
                    <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : loading ? "Connecting…" : "Not connected"}</span>
                    <button type="button" className="hb-primary-button" onClick={refresh}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button type="button" className="hb-primary-button ad-logout" onClick={() => void logout()}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {error && <div className="hb-demo-note" role="alert">Live data refresh failed: {error}</div>}

            <section className="hd-stats-grid">
                {cards.map(({ label, value, icon: Icon }) => (
                    <article className="hd-stat-card" key={label}>
                        <div className="hd-stat-icon blue"><Icon size={23} /></div>
                        <div><p>{label}</p><h2>{value}</h2></div>
                    </article>
                ))}
            </section>

            <section className="hd-panel">
                <div className="hd-panel-header">
                    <div><ShieldCheck size={20} /><h3>Active Emergency Operations</h3></div>
                    <button type="button" className="ad-device-link" onClick={() => navigate("/admin/traffic-devices")}>
                        <Cpu size={16} /> Manage traffic controllers
                    </button>
                </div>
                <div className="hd-activity-list">
                    {activeIncidents.length === 0 ? (
                        <div className="hb-empty"><Users size={25} /><strong>{loading ? "Loading operations…" : "No active emergencies"}</strong><span>New incidents will appear here as they are reported.</span></div>
                    ) : activeIncidents.map((incident) => (
                        <div className="hd-activity-item" key={incident.id}>
                            <div className="hd-activity-dot danger" />
                            <div>
                                <strong>{incident.incident_number}</strong>
                                <p>{incident.ambulance_vehicle_number || incident.ambulance?.vehicle_number || "Ambulance unassigned"} · {incident.hospital_name || incident.hospital?.name || "Hospital pending"} · {incident.status_display || incident.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
