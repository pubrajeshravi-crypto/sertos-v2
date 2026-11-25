import { useCallback, useState } from "react";
import { Ambulance, Clock3, MapPin, Radio, RefreshCw, ShieldAlert } from "lucide-react";
import { api, type Incident, type RouteSummary } from "../../lib/api";
import { useLiveQuery } from "../../lib/useLiveQuery";
import "./traffic-police.css";
import "./tracking-map.css";

type AmbulancePosition = {
    id: string;
    incidentId: string;
    condition: string;
    latitude: number;
    longitude: number;
    route: RouteSummary | null;
    priority: "High" | "Normal";
    destination: string;
    recordedAt: string;
};

type TrackingSnapshot = {
    positions: AmbulancePosition[];
    inTransitCount: number;
};

type PlotBounds = {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
};

function getPlotBounds(positions: AmbulancePosition[]): PlotBounds {
    if (!positions.length) {
        return { minLatitude: -1, maxLatitude: 1, minLongitude: -1, maxLongitude: 1 };
    }

    const latitudes = positions.map((position) => position.latitude);
    const longitudes = positions.map((position) => position.longitude);
    const latitudeSpan = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.002);
    const longitudeSpan = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.002);
    const latitudePadding = latitudeSpan * 0.2;
    const longitudePadding = longitudeSpan * 0.2;

    return {
        minLatitude: Math.min(...latitudes) - latitudePadding,
        maxLatitude: Math.max(...latitudes) + latitudePadding,
        minLongitude: Math.min(...longitudes) - longitudePadding,
        maxLongitude: Math.max(...longitudes) + longitudePadding,
    };
}

function projectPosition(position: AmbulancePosition, bounds: PlotBounds) {
    return {
        x: 82 + ((position.longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * 836,
        y: 510 - ((position.latitude - bounds.minLatitude) / (bounds.maxLatitude - bounds.minLatitude)) * 420,
    };
}

function formatTime(value: string) {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date)
        : "Time unavailable";
}

function formatRoute(route: RouteSummary | null) {
    if (!route || !Number.isFinite(route.distance_km)) return "Route estimate unavailable";
    return `${route.distance_km.toFixed(1)} km · ${route.duration_formatted || "ETA unavailable"}`;
}

export default function PoliceTracking() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const loadTracking = useCallback(async (): Promise<TrackingSnapshot> => {
        const incidents: Incident[] = await api.getPoliceIncidents();
        const inTransit = incidents.filter((incident) => incident.status === "IN_TRANSIT");
        const results = await Promise.all(inTransit.map(async (incident) => {
            const location = await api.getLocation(incident.id);
            if (!location) return null;

            const route = await api.getRoute(incident.id).catch(() => null);
            return {
                id: incident.ambulance_vehicle_number || incident.incident_number,
                incidentId: incident.id,
                condition: incident.description || "Emergency response",
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
                route,
                priority: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "High" as const : "Normal" as const,
                destination: incident.hospital_name || "Destination not assigned",
                recordedAt: location.recorded_at,
            };
        }));

        return {
            positions: results.filter((position): position is AmbulancePosition => position !== null),
            inTransitCount: inTransit.length,
        };
    }, []);
    const { data, loading, error, lastUpdated, refresh } = useLiveQuery(loadTracking, 5_000);
    const positions = data?.positions ?? [];
    const selected = positions.find((position) => position.incidentId === selectedId) ?? positions[0] ?? null;
    const bounds = getPlotBounds(positions);
    const status = error
        ? "API UNAVAILABLE"
        : loading && !data
            ? "CONNECTING"
            : positions.length
                ? "LIVE GPS REPORTS"
                : data?.inTransitCount
                    ? "WAITING FOR GPS"
                    : "NO ACTIVE TRACKS";

    return (
        <div className="police-tracking-page">
            <header className="police-tracking-header">
                <div>
                    <h1>Live Ambulance Tracking</h1>
                    <p>GPS positions from the police incident and location APIs. Updates every 5 seconds.</p>
                </div>
                <div className={`police-fleet-status ${error ? "offline" : positions.length ? "online" : "pending"}`}>
                    <span className="police-live-dot" />
                    {status}
                </div>
            </header>

            {error && <div className="tp-action-error" role="alert">Tracking refresh failed: {error}</div>}

            <section className="police-tracking-map" aria-label="Live ambulance coordinate map">
                <svg className="police-coordinate-map" viewBox="0 0 1000 600" role="img" aria-label="Ambulance GPS positions plotted by latitude and longitude">
                    <defs>
                        <pattern id="tracking-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" className="police-grid-line" fill="none" />
                        </pattern>
                    </defs>
                    <rect width="1000" height="600" fill="url(#tracking-grid)" />
                    <path d="M82 90V510H918" className="police-map-axis" fill="none" />
                    <text x="84" y="558" className="police-map-axis-label">LONGITUDE</text>
                    <text x="25" y="300" className="police-map-axis-label" transform="rotate(-90 25 300)">LATITUDE</text>

                    {positions.length > 0 && Array.from({ length: 5 }, (_, index) => {
                        const fraction = index / 4;
                        const longitude = bounds.minLongitude + (bounds.maxLongitude - bounds.minLongitude) * fraction;
                        const latitude = bounds.maxLatitude - (bounds.maxLatitude - bounds.minLatitude) * fraction;
                        const x = 82 + fraction * 836;
                        const y = 90 + fraction * 420;
                        return (
                            <g key={index} className="police-map-ticks">
                                <text x={x} y="536" textAnchor="middle">{longitude.toFixed(5)}</text>
                                <text x="72" y={y + 4} textAnchor="end">{latitude.toFixed(5)}</text>
                            </g>
                        );
                    })}

                    {positions.map((position) => {
                        const point = projectPosition(position, bounds);
                        return (
                            <g
                                key={position.incidentId}
                                className={`police-map-marker ${position.priority === "High" ? "high" : "normal"} ${selected?.incidentId === position.incidentId ? "selected" : ""}`}
                                transform={`translate(${point.x} ${point.y})`}
                                role="button"
                                tabIndex={0}
                                aria-label={`${position.id}, ${position.priority} priority, at ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`}
                                onClick={() => setSelectedId(position.incidentId)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedId(position.incidentId);
                                    }
                                }}
                            >
                                <circle className="police-marker-halo" r="22" />
                                <circle className="police-marker-core" r="8" />
                                <text x="15" y="-13">{position.id}</text>
                            </g>
                        );
                    })}
                </svg>

                {!positions.length && (
                    <div className="police-map-empty">
                        <MapPin size={22} />
                        <strong>{loading ? "Connecting to live location feed" : data?.inTransitCount ? "Awaiting ambulance GPS" : "No active ambulance positions"}</strong>
                        <span>{data?.inTransitCount ? `${data.inTransitCount} incident(s) in transit; waiting for a valid GPS fix.` : "Positions appear here when an incident is in transit and reports GPS."}</span>
                    </div>
                )}

                <div className="police-map-topbar">
                    <div className="police-map-count"><Ambulance size={17} /><strong>{positions.length} GPS position{positions.length === 1 ? "" : "s"}</strong></div>
                    <button type="button" onClick={() => setSelectedId(null)} className="police-map-control" disabled={!positions.length}>
                        <RefreshCw size={15} />Fit fleet
                    </button>
                </div>

                {selected && (
                    <aside className="police-selected-panel" aria-label="Selected ambulance details">
                        <div className="police-selected-header">
                            <div><span className="police-selected-label">SELECTED AMBULANCE</span><h2>{selected.id}</h2></div>
                        </div>
                        <div className="police-selected-condition"><ShieldAlert size={16} />{selected.condition}</div>
                        <div className="police-selected-details">
                            <div><span>Route estimate</span><strong>{formatRoute(selected.route)}</strong></div>
                            <div><span>GPS received</span><strong>{formatTime(selected.recordedAt)}</strong></div>
                            <div><span>Priority</span><strong className={selected.priority === "High" ? "police-high-text" : "police-normal-text"}>{selected.priority}</strong></div>
                        </div>
                        <div className="police-selected-destination"><MapPin size={15} />{selected.destination}</div>
                        <div className="police-selected-coordinates">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</div>
                    </aside>
                )}

                <div className="police-map-footer">
                    <span><Radio size={14} />Local coordinate plot · SERTOS API</span>
                    <span><Clock3 size={14} />{lastUpdated ? `Updated ${formatTime(lastUpdated.toISOString())}` : "Waiting for API"}</span>
                </div>
            </section>

            <section className="police-fleet-panel">
                <div className="police-fleet-heading">
                    <div><h2>Ambulances with GPS</h2><p>Select a vehicle to inspect its latest reported position.</p></div>
                    <span>{positions.length} vehicles</span>
                </div>
                <div className="police-fleet-list">
                    {positions.map((position) => (
                        <button
                            type="button"
                            key={position.incidentId}
                            className={`police-fleet-item ${selected?.incidentId === position.incidentId ? "selected" : ""}`}
                            onClick={() => setSelectedId(position.incidentId)}
                        >
                            <div className="police-fleet-icon"><Ambulance size={21} /></div>
                            <div className="police-fleet-info"><strong>{position.id}</strong><span>{position.condition}</span></div>
                            <div className="police-fleet-meta"><strong>{formatRoute(position.route)}</strong><span>{position.priority} priority · {formatTime(position.recordedAt)}</span></div>
                        </button>
                    ))}
                    {!positions.length && (
                        <div className="tp-empty-state">
                            {loading && !data
                                ? "Loading active incidents and GPS positions…"
                                : data?.inTransitCount
                                    ? "Incidents are in transit, but no valid location has been received yet."
                                    : "No incidents are currently marked in transit."}
                        </div>
                    )}
                </div>
                <button className="police-tracking-refresh" type="button" onClick={refresh}><RefreshCw size={15} />Refresh now</button>
            </section>
        </div>
    );
}
