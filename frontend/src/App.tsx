
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DriverPage from "./features/driver/DriverPage";
import LoginPage from "./features/auth/LoginPage";
import TrafficPoliceLayout from "./features/police/TrafficPoliceLayout";
import PoliceDashboard from "./features/police/PoliceDashboard";
import AmbulanceAlerts from "./features/police/AmbulanceAlerts";
import PoliceTracking from "./features/police/PoliceTracking";
import PoliceJunctions from "./features/police/PoliceJunctions";
import HospitalLayout from "./features/hospital/HospitalLayout";
import HospitalDashboard from "./features/hospital/HospitalDashboard";
import BedManagement from "./features/hospital/BedManagement";
import EmergencyAlerts from "./features/hospital/EmergencyAlerts";
import HospitalTracking from "./features/hospital/HospitalTracking";
import HospitalReports from "./features/hospital/HospitalReports";
import ConfirmationPage from "./features/driver/ConfirmationPage";
import AdminDashboard from "./features/admin/AdminDashboard";
import TrafficDeviceManagement from "./features/admin/TrafficDeviceManagement";
import IncidentHistory from "./features/shared/IncidentHistory";
import ProfilePage from "./features/shared/ProfilePage";
import { getSession } from "./lib/auth";
import SoundToggle from "./components/SoundToggle";
type UserRole = "driver" | "traffic_police" | "hospital" | "admin";

// Temporary route wrapper
function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const session = getSession();
  const roleMap: Record<UserRole, string> = {
    driver: "AMBULANCE_DRIVER",
    traffic_police: "POLICE_DISPATCHER",
    hospital: "HOSPITAL_STAFF",
    admin: "ADMIN",
  };

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.user.role !== roleMap[role] && session.user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <SoundToggle />
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/traffic-devices"
          element={
            <ProtectedRoute role="admin">
              <TrafficDeviceManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver"
          element={
            <ProtectedRoute role="driver">
              <DriverPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/confirmation"
          element={
            <ProtectedRoute role="driver">
              <ConfirmationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/police"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <PoliceDashboard />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/police/alerts"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <AmbulanceAlerts />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/police/tracking"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <PoliceTracking />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/police/junctions"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <PoliceJunctions />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/police/history"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <IncidentHistory role="police" />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/police/profile"
          element={
            <ProtectedRoute role="traffic_police">
              <TrafficPoliceLayout>
                <ProfilePage />
              </TrafficPoliceLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hospital"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <HospitalDashboard />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hospital/beds"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <BedManagement />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/alerts"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <EmergencyAlerts />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/tracking"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <HospitalTracking />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/history"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <IncidentHistory role="hospital" />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/reports"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <HospitalReports />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/profile"
          element={
            <ProtectedRoute role="hospital">
              <HospitalLayout>
                <ProfilePage />
              </HospitalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/settings"
          element={
            <ProtectedRoute role="hospital">
              <Navigate to="/hospital/profile" replace />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
