
import {
    Activity,
    Ambulance,
    Bell,
    Clock3,
    Hospital,
    Navigation,
    ShieldCheck,
    Mic,
    UserRound,
    Siren,
    ChevronDown,
    ChevronRight,
    Radio,
    Check,
    Circle,
} from 'lucide-react'

import { useState } from 'react'

interface HomePageProps {
    driverName: string
    driverPhoto?: string
    ambulanceNumber: string
    isOnDuty: boolean

    patientReport: string
    showDetails: boolean
    onTogglePatientReport: () => void

    hospitalETA?: string
    destination?: string
    gpsStatus?: string
    emergencyStatus?: string
    trafficStatus?: string
    hasActiveIncident?: boolean
    gpsDetected?: boolean
    hospitalAssigned?: boolean
    policeAcknowledged?: boolean
    notificationCount?: number

    onStartEmergency: () => void
    onNotificationClick?: () => void
    onTrafficClick?: () => void
}

export default function HomePage({
    driverName,
    driverPhoto,
    ambulanceNumber,
    isOnDuty,
    patientReport,
    onTogglePatientReport,
    hospitalETA = '-- min',
    destination = 'Not selected',
    gpsStatus = 'Waiting for GPS',
    emergencyStatus = 'READY',
    trafficStatus = 'Waiting',
    hasActiveIncident = false,
    gpsDetected = false,
    hospitalAssigned = false,
    policeAcknowledged = false,
    notificationCount = 0,
    onStartEmergency,
    onNotificationClick,
    onTrafficClick,
}: HomePageProps) {

    const [reportExpanded, setReportExpanded] = useState(false)
    const stages = [
        {
            title: 'Location Detected',
            detail: gpsDetected ? 'Live GPS coordinates received.' : 'Waiting for a valid GPS coordinate.',
            status: gpsDetected ? 'complete' : 'waiting',
        },
        {
            title: 'Scanning Nearby Hospitals',
            detail: hospitalAssigned ? 'Hospital options reviewed for this emergency.' : 'Hospital search begins during confirmation.',
            status: hospitalAssigned ? 'complete' : hasActiveIncident ? 'active' : 'waiting',
        },
        {
            title: 'Hospital Assigned',
            detail: hospitalAssigned ? destination : 'Awaiting destination selection.',
            status: hospitalAssigned ? 'complete' : hasActiveIncident ? 'active' : 'waiting',
        },
        {
            title: 'Police Coordination',
            detail: policeAcknowledged ? 'Dispatch acknowledgement received.' : 'Awaiting police dispatcher acknowledgement.',
            status: policeAcknowledged ? 'complete' : hospitalAssigned ? 'active' : 'waiting',
        },
        {
            title: 'Traffic Signal Bypass',
            detail: 'Awaiting controller status from the police junction console.',
            status: 'waiting',
        },
    ] as const

    return (
        <div className="driver-command max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">

            {/* WELCOME SECTION */}

            <section className="glass-surface relative overflow-hidden rounded-3xl p-5 text-white">

                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -right-5 bottom-[-65px] w-40 h-40 rounded-full bg-[#14B8A6]/10" />

                <div className="relative z-10 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">

                            {driverPhoto ? (
                                <img
                                    src={driverPhoto}
                                    alt="Driver"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserRound size={29} className="text-white/80" />
                            )}

                        </div>

                        <div>
                            <p className="text-xs text-slate-300">
                                Welcome back,
                            </p>

                            <h2 className="text-lg font-bold mt-1">
                                {driverName}
                            </h2>

                            <div className="flex items-center gap-1.5 mt-1">

                                <span
                                    className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-command-emerald' : 'bg-slate-400'
                                        }`}
                                />

                                <span className="text-[11px] text-slate-300">
                                    {isOnDuty ? 'Ready for dispatch' : 'Unavailable'}
                                </span>

                            </div>
                        </div>

                    </div>

                    <button
                        onClick={onNotificationClick}
                        aria-label="Notifications"
                        className="relative w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center"
                    >
                        <Bell size={19} />
                        {notificationCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">{notificationCount > 9 ? '9+' : notificationCount}</span>}
                    </button>

                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">

                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">
                            Your responsibility
                        </p>

                        <p className="text-sm font-semibold mt-1">
                            Every Second Matters.
                        </p>
                    </div>

                    <div className="bg-command-emerald/10 border border-command-emerald/20 rounded-xl p-2.5">
                        <ShieldCheck size={23} className="text-command-emerald" />
                    </div>

                </div>

            </section>


            {/* ASSIGNED AMBULANCE */}

            <section className="glass-surface rounded-2xl p-4">

                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Ambulance size={24} className="text-red-300" />
                        </div>

                        <div>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                                Assigned ambulance
                            </p>

                            <h3 className="text-base font-bold text-command-text mt-1">
                                {ambulanceNumber}
                            </h3>
                        </div>

                    </div>

                    <div className={`${ambulanceNumber === 'Not assigned' ? 'bg-white/5' : 'bg-command-emerald/10'} px-3 py-1.5 rounded-full`}>
                        <span className={`text-[10px] font-bold ${ambulanceNumber === 'Not assigned' ? 'text-slate-400' : 'text-command-emerald'}`}>
                            {ambulanceNumber === 'Not assigned' ? 'NO ASSIGNMENT' : 'ASSIGNED'}
                        </span>
                    </div>

                </div>

            </section>


            {/* EMERGENCY ALERT */}

            <section className="glass-surface border-red-400/20 rounded-2xl overflow-hidden">

                <div className="p-4">

                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Siren size={23} className="text-red-300" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-command-text">
                                Emergency Response
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                                Start an emergency response mission
                            </p>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full ${hasActiveIncident
                            ? 'text-red-200 bg-red-500/10'
                            : 'text-command-emerald bg-command-emerald/10'
                            }`}>
                            {emergencyStatus}
                        </span>

                    </div>

                    <button
                        onClick={onStartEmergency}
                        disabled={!isOnDuty || hasActiveIncident}
                        className="w-full mt-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-red-500/15 active:scale-[0.98] transition-all duration-200"
                    >
                        <Mic size={18} />
                        {hasActiveIncident
                            ? 'Emergency Active'
                            : 'Speak Emergency'
                        }
                    </button>

                </div>

            </section>

            <section className="glass-surface driver-pipeline rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="pipeline-eyebrow">LIVE RESPONSE FLOW</p>
                        <h3 className="mt-1 text-sm font-bold text-command-text">Emergency pipeline</h3>
                    </div>
                    <span className="pipeline-state">{hasActiveIncident ? 'MISSION ACTIVE' : 'STANDBY'}</span>
                </div>
                <ol className="pipeline-steps">
                    {stages.map((stage, index) => (
                        <li className={`pipeline-step pipeline-${stage.status}`} key={stage.title}>
                            <span className="pipeline-marker" aria-hidden="true">
                                {stage.status === 'complete' ? <Check size={13} /> : <Circle size={7} />}
                            </span>
                            <div className="pipeline-copy">
                                <div className="pipeline-step-heading">
                                    <span className="pipeline-index">{String(index + 1).padStart(2, '0')}</span>
                                    <strong>{stage.title}</strong>
                                    <span className="pipeline-step-state">{stage.status === 'complete' ? 'COMPLETE' : stage.status === 'active' ? 'IN PROGRESS' : 'STANDBY'}</span>
                                </div>
                                <p>{stage.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
                <p className="pipeline-footnote">Controller execution is shown only when reported by the junction system.</p>
            </section>

            {/* LIVE INFORMATION */}

            <section>

                <div className="flex items-center justify-between mb-3">

                    <h3 className="text-sm font-bold text-command-text">
                        Live Information
                    </h3>

                    <div className="flex items-center gap-1.5 text-command-emerald">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasActiveIncident ? 'bg-command-emerald' : 'bg-amber-400'}`} />
                        <span className="text-[10px] font-semibold">
                            {hasActiveIncident ? 'MISSION ACTIVE' : 'AWAITING DISPATCH'}
                        </span>
                    </div>

                </div>

                <div className="grid grid-cols-2 gap-3">

                    {/* ETA */}

                    <div className="glass-surface rounded-2xl p-4">

                        <div className="w-9 h-9 rounded-xl bg-command-emerald/10 flex items-center justify-center">
                            <Clock3 size={19} className="text-command-emerald" />
                        </div>

                        <p className="text-[11px] text-command-muted mt-3">
                            Hospital ETA
                        </p>

                        <h3 className="text-xl font-extrabold text-command-text mt-1">
                            {hospitalETA}
                        </h3>

                    </div>


                    {/* DESTINATION */}

                    <div className="glass-surface rounded-2xl p-4">

                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Hospital size={19} className="text-red-300" />
                        </div>

                        <p className="text-[11px] text-slate-500 mt-3">
                            Destination
                        </p>

                        <h3 className="text-sm font-bold text-command-text mt-1 truncate">
                            {destination}
                        </h3>

                    </div>


                    {/* GPS */}

                    <div className="glass-surface rounded-2xl p-4">

                        <div className="w-9 h-9 rounded-xl bg-command-emerald/10 flex items-center justify-center">
                            <Navigation size={19} className="text-command-emerald" />
                        </div>

                        <p className="text-[11px] text-command-muted mt-3">
                            GPS Tracking
                        </p>

                        <h3 className="text-sm font-bold text-command-text mt-1">
                            {gpsStatus}
                        </h3>

                    </div>


                    {/* RESPONSE */}

                    <div className="glass-surface rounded-2xl p-4">

                        <div className="w-9 h-9 rounded-xl bg-command-emerald/10 flex items-center justify-center">
                            <Radio size={19} className="text-command-emerald" />
                        </div>

                        <p className="text-[11px] text-command-muted mt-3">
                            Emergency Status
                        </p>

                        <h3 className="text-sm font-bold text-command-text mt-1">
                            {emergencyStatus}
                        </h3>

                    </div>

                </div>

            </section>


            {/* TRAFFIC COORDINATION */}

            <button
                type="button"
                onClick={onTrafficClick}
                className="glass-surface w-full text-left rounded-2xl p-4 active:scale-[0.99] transition-all duration-200"
            >

                <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-command-emerald/10 flex items-center justify-center">
                    <ShieldCheck size={23} className="text-command-emerald" />
                    </div>

                    <div className="flex-1 min-w-0">

                        <h3 className="text-sm font-bold text-command-text">
                            Traffic Coordination
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                            Traffic police clearance updates
                        </p>

                    </div>

                    <span className="text-[10px] font-semibold text-command-amber bg-command-amber/10 px-2.5 py-1.5 rounded-full">
                        {trafficStatus}
                    </span>

                </div>
            </button>


            {/* PATIENT REPORT */}

            {patientReport && (

                <section className="glass-surface rounded-2xl overflow-hidden">

                    <button
                        onClick={() => {
                            setReportExpanded(!reportExpanded)
                            onTogglePatientReport()
                        }}
                        className="w-full p-4 flex items-center gap-3 text-left"
                    >

                        <div className="w-11 h-11 bg-command-emerald/10 text-command-emerald rounded-xl flex items-center justify-center">
                            <Activity size={22} />
                        </div>

                        <div className="flex-1 min-w-0">

                            <h3 className="font-bold text-sm text-command-text">
                                Patient Report
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 truncate">
                                {patientReport}
                            </p>

                        </div>

                        {reportExpanded
                            ? <ChevronDown size={19} className="text-slate-400" />
                            : <ChevronRight size={19} className="text-slate-400" />
                        }

                    </button>

                    {reportExpanded && (

                        <div className="border-t border-white/10 p-4">

                            <p className="text-xs text-slate-500 font-semibold uppercase mb-2">
                                Recorded patient report transcript
                            </p>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <p className="text-sm text-command-text leading-6">
                                    {patientReport}
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 mt-3">
                                The report is available for review. Emergency confirmation is handled on the separate confirmation page.
                            </p>

                        </div>

                    )}

                </section>

            )}


            {/* HANDS-FREE REPORTING */}

            <section className="glass-surface rounded-2xl p-4 text-white">

                <div className="flex items-center gap-3">

                    <div className="w-11 h-11 bg-command-emerald/10 rounded-xl flex items-center justify-center">
                    <Mic size={23} className="text-command-emerald" />
                    </div>

                    <div className="flex-1">

                        <h3 className="text-sm font-bold">
                            Hands-free reporting
                        </h3>

                        <p className="text-xs text-slate-300 mt-1 leading-5">
                            Record and report patient condition using the microphone button. Press STOP when reporting is complete.
                        </p>

                    </div>

                </div>

            </section>

        </div>
    )
}
