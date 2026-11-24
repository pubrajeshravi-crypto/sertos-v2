import { useEffect, useRef, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import { Ambulance, Clock3, MapPin, Navigation, Radio, RefreshCw, ShieldAlert, X } from "lucide-react";
import { api, type Incident, type RouteSummary } from "../../lib/api";
import "./traffic-police.css";

type AmbulanceData = {
    id: string;
    incidentId: string;
    condition: string;
    lat: number;
    lng: number;
    eta: string;
    priority: "High" | "Normal";
    destination: string;
    recordedAt: string;
};

export default function PoliceTracking() {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [mapReady, setMapReady] = useState(false);
    const [mapStatus, setMapStatus] = useState("Loading map…");
    const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
    const [selected, setSelected] = useState<AmbulanceData | null>(null);
    const [apiError, setApiError] = useState("");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    useEffect(() => {
        let active = true;
        const refreshTracking = async () => {
            try {
                const incidents: Incident[] = await api.getPoliceIncidents();
                const inTransit = incidents.filter((incident) => incident.status === "IN_TRANSIT");
                const results = await Promise.all(inTransit.map(async (incident) => {
                    const location = await api.getLocation(incident.id).catch(() => null);
                    if (!location) return null;
                    const route: RouteSummary | null = await api.getRoute(incident.id).catch(() => null);
                    return {
                        id: incident.ambulance_vehicle_number || incident.incident_number,
                        incidentId: incident.id,
                        condition: incident.description || "Emergency response",
                        lat: Number(location.latitude),
                        lng: Number(location.longitude),
                        eta: route?.duration_formatted || "Not available",
                        priority: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "High" as const : "Normal" as const,
                        destination: incident.hospital_name || "Destination not assigned",
                        recordedAt: location.recorded_at,
                    };
                }));
                if (!active) return;
                const records = results.filter((record): record is AmbulanceData => Boolean(record));
                setAmbulances(records);
                setSelected((current) => current ? records.find((record) => record.id === current.id) ?? records[0] ?? null : records[0] ?? null);
                setUpdatedAt(new Date());
                setApiError("");
            } catch (cause: unknown) {
                if (active) setApiError(cause instanceof Error ? cause.message : "Unable to load ambulance positions.");
            }
        };
        void refreshTracking();
        const interval = window.setInterval(refreshTracking, 5_000);
        return () => { active = false; window.clearInterval(interval); };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const initializeMap = async () => {
            try {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                if (!apiKey) throw new Error("Google Maps key is not configured for this build.");
                const mapsLibrary = await importLibrary("maps") as google.maps.MapsLibrary;
                if (cancelled || !mapElementRef.current) return;
                const map = new mapsLibrary.Map(mapElementRef.current, {
                    center: { lat: 0, lng: 0 },
                    zoom: 2,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                    gestureHandling: "greedy",
                });
                mapRef.current = map;
                setMapReady(true);
                setMapStatus("Map connected; waiting for GPS reports");
            } catch (cause: unknown) {
                if (!cancelled) setMapStatus(cause instanceof Error ? cause.message : "Unable to load map.");
            }
        };
        void initializeMap();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map) return;
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        if (!ambulances.length) {
            setMapStatus(apiError ? "Tracking API unavailable" : "Waiting for ambulance GPS reports");
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        ambulances.forEach((ambulance) => {
            const marker = new google.maps.Marker({ map, position: { lat: ambulance.lat, lng: ambulance.lng }, title: `${ambulance.id} · ${ambulance.priority} priority` });
            marker.addListener("click", () => setSelected(ambulance));
            markersRef.current.push(marker);
            bounds.extend({ lat: ambulance.lat, lng: ambulance.lng });
        });
        map.fitBounds(bounds, 65);
        setMapStatus(`${ambulances.length} live GPS position${ambulances.length === 1 ? "" : "s"}`);
    }, [ambulances, mapReady, apiError]);

    useEffect(() => () => {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        mapRef.current = null;
    }, []);

    const focusAmbulance = (ambulance: AmbulanceData) => {
        setSelected(ambulance);
        mapRef.current?.panTo({ lat: ambulance.lat, lng: ambulance.lng });
        mapRef.current?.setZoom(16);
    };

    const showAllAmbulances = () => {
        if (!mapRef.current || !ambulances.length) return;
        const bounds = new google.maps.LatLngBounds();
        ambulances.forEach((ambulance) => bounds.extend({ lat: ambulance.lat, lng: ambulance.lng }));
        mapRef.current.fitBounds(bounds, 65);
    };

    return <div className="police-tracking-page">
        <div className="police-tracking-header"><div><h1>Live Ambulance Tracking</h1><p>Latest GPS report for each ambulance marked in transit.</p></div><div className="police-fleet-status"><span className="police-live-dot" />{apiError ? "API UNAVAILABLE" : ambulances.length ? "LIVE GPS REPORTS" : "WAITING FOR GPS"}</div></div>
        {apiError && <div className="tp-action-error" role="alert">Tracking refresh failed: {apiError}</div>}
        <section className="police-tracking-map"><div ref={mapElementRef} className="police-google-map" />{(!mapReady || !ambulances.length) && <div className="police-map-loading">{mapReady ? mapStatus : mapStatus}</div>}
            <div className="police-map-topbar"><div className="police-map-count"><Ambulance size={17} /><strong>{ambulances.length} GPS positions</strong></div><button type="button" onClick={showAllAmbulances} className="police-map-control" disabled={!ambulances.length}><RefreshCw size={15} />Show all</button></div>
            {selected && <div className="police-selected-panel"><div className="police-selected-header"><div><span className="police-selected-label">SELECTED AMBULANCE</span><h2>{selected.id}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close ambulance details"><X size={18} /></button></div><div className="police-selected-condition"><ShieldAlert size={16} />{selected.condition}</div><div className="police-selected-details"><div><span>Driver</span><strong>Not included in live incident feed</strong></div><div><span>ETA</span><strong>{selected.eta}</strong></div><div><span>GPS report</span><strong>{new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(selected.recordedAt))}</strong></div><div><span>Priority</span><strong className={selected.priority === "High" ? "police-high-text" : "police-normal-text"}>{selected.priority}</strong></div></div><div className="police-selected-destination"><MapPin size={15} />{selected.destination} · {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</div><button type="button" className="police-focus-button" onClick={() => focusAmbulance(selected)}><Navigation size={15} />Focus on ambulance</button></div>}
            <div className="police-map-footer"><span><Radio size={14} />{mapStatus}</span><span><Clock3 size={14} />{updatedAt ? `API refreshed ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(updatedAt)}` : "Waiting for API"}</span></div>
        </section>
        <section className="police-fleet-panel"><div className="police-fleet-heading"><div><h2>Ambulances with GPS</h2><p>Choose a vehicle to focus its reported position.</p></div><span>{ambulances.length} vehicles</span></div><div className="police-fleet-list">{ambulances.map((ambulance) => <button type="button" key={ambulance.id} className={`police-fleet-item ${selected?.id === ambulance.id ? "selected" : ""}`} onClick={() => focusAmbulance(ambulance)}><div className="police-fleet-icon"><Ambulance size={21} /></div><div className="police-fleet-info"><strong>{ambulance.id}</strong><span>{ambulance.condition}</span></div><div className="police-fleet-meta"><strong>{ambulance.eta}</strong><span>{ambulance.priority} priority</span></div></button>)}{!ambulances.length && <div className="tp-empty-state">{apiError || "No ambulance GPS points have arrived for incidents in transit."}</div>}</div></section>
    </div>;
}
