import { useEffect, useRef, useState } from "react";
import { api, type IncidentLocation } from "../../lib/api";
import {
    Hospital,
    Navigation,
    MapPin,
    Clock3,
    CarFront,
    Radio,
} from "lucide-react";

interface RoutePageProps {
    incidentId?: string;
    onStartNavigation: () => void;
}

type Coordinates = {
    lat: number;
    lng: number;
};

type ProjectedPoint = {
    x: number;
    y: number;
};

type RouteData = {
    distance_km: number;
    duration_formatted: string;
};

function parseCoordinates(latitude: unknown, longitude: unknown): Coordinates | null {
    const lat = typeof latitude === "number" || typeof latitude === "string" ? Number(latitude) : NaN;
    const lng = typeof longitude === "number" || typeof longitude === "string" ? Number(longitude) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }
    return { lat, lng };
}

function coordinatesFromLocation(location: IncidentLocation | null): Coordinates | null {
    return location ? parseCoordinates(location.latitude, location.longitude) : null;
}

function projectPoints(position: Coordinates | null, destination: Coordinates | null) {
    const points = [position, destination].filter((point): point is Coordinates => Boolean(point));
    if (!points.length) return { position: null, destination: null };
    const minLat = Math.min(...points.map((point) => point.lat));
    const maxLat = Math.max(...points.map((point) => point.lat));
    const minLng = Math.min(...points.map((point) => point.lng));
    const maxLng = Math.max(...points.map((point) => point.lng));
    const latRange = Math.max(maxLat - minLat, 0.008);
    const lngRange = Math.max(maxLng - minLng, 0.008);
    const project = (point: Coordinates): ProjectedPoint => ({
        x: 150 + ((point.lng - minLng) / lngRange) * 600,
        y: 95 + ((maxLat - point.lat) / latRange) * 310,
    });

    return {
        position: position ? project(position) : null,
        destination: destination ? project(destination) : null,
    };
}

function RoutePage({ incidentId, onStartNavigation }: RoutePageProps) {
    const [position, setPosition] = useState<Coordinates | null>(null);
    const [destination, setDestination] = useState<Coordinates | null>(null);
    const [destinationName, setDestinationName] = useState("Hospital destination");
    const [gpsStatus, setGpsStatus] = useState("Waiting for GPS");
    const [routeError, setRouteError] = useState("");
    const [route, setRoute] = useState<RouteData | null>(null);
    const lastLocationPostAtRef = useRef(0);
    const hasCoordinatesRef = useRef(false);

    useEffect(() => {
        if (!incidentId) {
            setPosition(null);
            setDestination(null);
            setRoute(null);
            setGpsStatus("No active incident");
            hasCoordinatesRef.current = false;
            return;
        }

        let active = true;
        const loadDestination = async () => {
            try {
                const [incidents, hospitals] = await Promise.all([
                    api.getDriverIncidents(),
                    api.getHospitals(),
                ]);
                if (!active) return;
                const incident = incidents.find((item) => item.id === incidentId);
                const hospitalId = incident?.hospital?.id;
                const hospital = hospitals.find((item) => item.id === hospitalId);
                setDestinationName(hospital?.name || incident?.hospital_name || "Hospital destination");
                setDestination(parseCoordinates(hospital?.latitude, hospital?.longitude));
            } catch (reason) {
                if (active) {
                    setRouteError(reason instanceof Error ? reason.message : "Unable to load destination details.");
                }
            }
        };

        const refreshRouteAndLocation = async () => {
            const [locationResult, routeResult] = await Promise.allSettled([
                api.getLocation(incidentId),
                api.getRoute(incidentId),
            ]);
            if (!active) return;

            if (locationResult.status === "fulfilled") {
                const current = coordinatesFromLocation(locationResult.value);
                if (current) {
                    setPosition(current);
                    hasCoordinatesRef.current = true;
                    setGpsStatus("Live incident coordinates");
                }
            } else {
                setGpsStatus(locationResult.reason instanceof Error
                    ? `Location feed unavailable: ${locationResult.reason.message}`
                    : "Location feed unavailable");
            }

            if (routeResult.status === "fulfilled") {
                setRoute(routeResult.value);
                setRouteError("");
            } else {
                setRouteError(routeResult.reason instanceof Error
                    ? routeResult.reason.message
                    : "Route service unavailable.");
            }
        };

        void loadDestination();
        void refreshRouteAndLocation();
        const timer = window.setInterval(() => {
            void refreshRouteAndLocation();
        }, 15_000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [incidentId]);

    useEffect(() => {
        if (!navigator.geolocation) {
            if (!hasCoordinatesRef.current) setGpsStatus("GPS not supported by browser");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (location) => {
                const currentPosition: Coordinates = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                setPosition(currentPosition);
                hasCoordinatesRef.current = true;
                setGpsStatus("Browser GPS connected");

                if (incidentId) {
                    const now = Date.now();
                    if (now - lastLocationPostAtRef.current >= 5_000) {
                        lastLocationPostAtRef.current = now;
                        api.sendLocation(incidentId, currentPosition.lat, currentPosition.lng)
                            .catch((reason: unknown) => {
                                console.error("GPS update failed:", reason);
                                setGpsStatus(reason instanceof Error
                                    ? `GPS upload failed: ${reason.message}`
                                    : "GPS upload failed");
                            });
                    }
                }
            },
            (error) => {
                console.error("GPS error:", error);
                const messages: Record<number, string> = {
                    1: "GPS permission denied",
                    2: "GPS position unavailable",
                    3: "GPS request timed out",
                };
                if (!hasCoordinatesRef.current) setGpsStatus(messages[error.code] || "Unable to access GPS");
            },
            { enableHighAccuracy: true, maximumAge: 3_000, timeout: 15_000 },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [incidentId]);

    const projected = projectPoints(position, destination);
    const routePath = projected.position && projected.destination
        ? `M ${projected.position.x} ${projected.position.y} C ${(projected.position.x + projected.destination.x) / 2} ${projected.position.y - 42}, ${(projected.position.x + projected.destination.x) / 2} ${projected.destination.y + 42}, ${projected.destination.x} ${projected.destination.y}`
        : "";

    return (
        <div className="driver-route-page">
            <section className="glass-surface route-summary">
                <div className="route-hospital-icon">
                    <Hospital size={22} />
                </div>
                <div className="route-destination-copy">
                    <p>EMERGENCY DESTINATION</p>
                    <h2>{destinationName}</h2>
                    <span>{route ? "Route summary from backend" : routeError || "Waiting for route data"}</span>
                </div>
                <div className="route-summary-eta">
                    <span>ETA</span>
                    <strong>{route?.duration_formatted ?? "-- min"}</strong>
                </div>
            </section>

            <section className="driver-coordinate-map" aria-label="Live ambulance and hospital coordinate plot">
                <svg className="driver-coordinate-svg" viewBox="0 0 900 500" role="img" aria-label="Schematic connection between ambulance GPS and assigned hospital">
                    <defs>
                        <pattern id="driver-map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(169, 210, 179, 0.08)" strokeWidth="1" />
                        </pattern>
                        <radialGradient id="driver-map-glow">
                            <stop offset="0%" stopColor="#2b9b66" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#2b9b66" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="900" height="500" fill="url(#driver-map-glow)" />
                    <rect width="900" height="500" fill="url(#driver-map-grid)" />
                    <path d="M 0 370 C 190 320, 260 400, 420 340 S 700 260, 900 310" className="driver-map-road" />
                    <path d="M 130 0 C 210 130, 170 300, 290 500 M 650 0 C 590 160, 710 340, 620 500" className="driver-map-road-secondary" />

                    {routePath && <path d={routePath} className="driver-map-route" />}

                    {projected.destination && (
                        <g transform={`translate(${projected.destination.x} ${projected.destination.y})`}>
                            <circle r="18" className="driver-map-hospital-halo" />
                            <circle r="8" className="driver-map-hospital-marker" />
                            <text x="15" y="-13" className="driver-map-label">HOSPITAL</text>
                        </g>
                    )}

                    {projected.position && (
                        <g transform={`translate(${projected.position.x} ${projected.position.y})`}>
                            <circle r="22" className="driver-map-ambulance-halo" />
                            <circle r="9" className="driver-map-ambulance-marker" />
                            <text x="16" y="24" className="driver-map-label">AMBULANCE · LIVE</text>
                        </g>
                    )}

                    {!position && (
                        <g transform="translate(450 250)">
                            <circle r="28" className="driver-map-waiting-ring" />
                            <MapPin size={22} className="driver-map-waiting-icon" />
                            <text x="0" y="52" textAnchor="middle" className="driver-map-waiting-text">WAITING FOR GPS COORDINATES</text>
                        </g>
                    )}
                </svg>

                <div className="driver-map-top-label">
                    <MapPin size={13} />
                    <span>LIVE COORDINATE VIEW</span>
                </div>
                <div className="driver-map-bottom-label">
                    <span className={`driver-map-status-dot ${position ? "is-live" : ""}`} />
                    <span>{gpsStatus}</span>
                </div>
                {position && (
                    <div className="driver-map-coordinate-readout">
                        {position.lat.toFixed(5)}° N&nbsp; / &nbsp;{position.lng.toFixed(5)}° E
                    </div>
                )}
                <span className="driver-map-schematic-note">SCHEMATIC COORDINATE LINK · NOT A ROAD-BY-ROAD ROUTE</span>
            </section>

            <section className="glass-surface route-metrics">
                <div>
                    <CarFront size={21} />
                    <span>DISTANCE</span>
                    <strong>{route ? `${route.distance_km.toFixed(1)} km` : "--"}</strong>
                </div>
                <div className="route-metric-divider" />
                <div>
                    <Clock3 size={20} />
                    <span>ESTIMATED ARRIVAL</span>
                    <strong>{route?.duration_formatted ?? "--"}</strong>
                </div>
                <div className="route-metric-divider" />
                <div>
                    <Radio size={20} />
                    <span>TRACKING SOURCE</span>
                    <strong>{position ? "API / GPS" : "WAITING"}</strong>
                </div>
            </section>

            <button
                type="button"
                onClick={onStartNavigation}
                disabled={!position || !incidentId}
                className="route-start-button"
            >
                <Navigation size={18} />
                Start Navigation
            </button>
        </div>
    );
}

export default RoutePage;
