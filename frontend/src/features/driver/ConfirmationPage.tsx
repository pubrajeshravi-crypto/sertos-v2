
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
    Ambulance,
    ArrowLeft,
    CheckCircle2,
    MapPin,
    Mic,
    ShieldAlert,
    XCircle,
} from 'lucide-react'
import { api, type Hospital } from '../../lib/api'
import { playSound } from '../../lib/sound'

type ConfirmationState = {
    patientReport?: string
}

function ConfirmationPage() {
    const navigate = useNavigate()
    const location = useLocation()

    const state = location.state as ConfirmationState | null
    const patientReport = state?.patientReport || ''
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [hospitalId, setHospitalId] = useState('')
    const [loading, setLoading] = useState(false)
    const [hospitalsLoading, setHospitalsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.getHospitals()
            .then((items) => {
                setHospitals(items)
                if (items[0]) setHospitalId(items[0].id)
            })
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load hospitals.'))
            .finally(() => setHospitalsLoading(false))
    }, [])

    const handleCancel = () => {
        playSound('tick')
        navigate('/driver', {
            state: {
                patientReport,
                returnFromConfirmation: true,
            },
        })
    }

    const handleConfirm = async () => {
        if (!patientReport.trim() || !hospitalId || loading) return
        setLoading(true)
        setError('')
        playSound('tick')
        try {
            const incident = await api.createEmergency({
                hospital_id: hospitalId,
                severity: 'HIGH',
                description: patientReport,
                patient: { name: 'Emergency patient', medical_notes: patientReport },
            })
            navigate('/driver', {
                state: { patientReport, emergencyActivated: true, incident },
            })
            playSound('alert')
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'Unable to activate emergency.')
            playSound('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen">

            {/* Header */}
            <header className="glass-surface border-x-0 border-t-0 px-4 py-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">

                    <button
                        onClick={handleCancel}
                        className="glass-pill p-2 rounded-full transition-all duration-200 active:scale-[0.98]"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="font-extrabold text-lg">
                            Emergency Confirmation
                        </h1>
                        <p className="text-xs text-command-muted">
                            Review before activating emergency
                        </p>
                    </div>

                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

                {/* Warning */}
                <div className="glass-surface border-red-400/20 rounded-2xl p-5 text-center">

                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert size={34} className="text-red-300" />
                    </div>

                    <h2 className="text-xl font-extrabold text-red-200 mt-4">
                        Confirm Emergency?
                    </h2>

                    <p className="text-sm text-red-100/70 mt-2 leading-6">
                        After confirmation, the emergency ride workflow
                        will start and the hospital and traffic alert
                        processes will be initiated.
                    </p>

                </div>

                {/* Voice Report */}
                <div className="glass-surface rounded-2xl p-4 space-y-3">

                    <div className="flex items-center gap-2">
                        <div className="bg-command-emerald/10 p-2 rounded-xl">
                            <Mic size={20} className="text-command-emerald" />
                        </div>

                        <div>
                            <h3 className="font-bold text-sm">
                                Patient Voice Report
                            </h3>
                            <p className="text-xs text-command-muted">
                                Recorded speech transcript
                            </p>
                        </div>

                        <span className="ml-auto text-[10px] bg-command-emerald/10 text-command-emerald px-2 py-1 rounded-full font-bold">
                            CAPTURED
                        </span>
                    </div>

                    <div className="bg-white/[0.035] border border-white/10 rounded-xl p-4 min-h-28">
                        <p className="text-sm leading-7 whitespace-pre-wrap">
                            {patientReport || 'No patient report available.'}
                        </p>
                    </div>

                    {!patientReport.trim() && (
                        <p className="text-xs text-red-300">
                            A patient report is required before confirmation.
                        </p>
                    )}

                </div>

                {/* Activation Information */}
                <div className="glass-surface rounded-2xl p-4 space-y-4">

                    <h3 className="font-bold text-sm">
                        What happens after confirmation?
                    </h3>

                    {[
                        {
                            icon: Ambulance,
                            title: 'Emergency ride activation',
                            description: 'The ambulance ride status becomes active.',
                        },
                        {
                            icon: CheckCircle2,
                            title: 'Hospital notification',
                            description: 'Patient report and emergency details are prepared for the hospital.',
                        },
                        {
                            icon: ShieldAlert,
                            title: 'Traffic police alert',
                            description: 'Emergency route and junction alerts are initiated.',
                        },
                    ].map((item, index) => {
                        const Icon = item.icon

                        return (
                            <div key={index} className="flex gap-3">
                                <div className="w-10 h-10 shrink-0 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <Icon size={20} className="text-red-300" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-command-muted mt-1 leading-5">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}

                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                    <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-bold">Destination hospital</legend>
                        {hospitalsLoading && <p className="text-xs text-command-muted">Scanning available hospitals…</p>}
                        {!hospitalsLoading && !hospitals.length && !error && <p className="text-xs text-command-amber">No active hospitals are currently available.</p>}
                        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                        <div className="grid gap-3" role="group" aria-label="Available destination hospitals">
                            {hospitals.map((hospital) => {
                                const selected = hospital.id === hospitalId;
                                return (
                                    <button
                                        key={hospital.id}
                                        type="button"
                                        aria-pressed={selected}
                                        disabled={loading || hospitalsLoading}
                                        onClick={() => {
                                            setHospitalId(hospital.id);
                                            playSound('tick');
                                        }}
                                        className={`glass-surface flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                                            selected
                                                ? 'border-command-emerald/55 bg-command-emerald/10'
                                                : 'hover:border-white/25'
                                        }`}
                                    >
                                        <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                                            selected ? 'bg-command-emerald/15 text-command-emerald' : 'bg-white/5 text-command-muted'
                                        }`}>
                                            {selected ? <CheckCircle2 size={19} /> : <MapPin size={19} />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold text-command-text">{hospital.name}</span>
                                            <span className="mt-1 block text-xs text-command-muted">{hospital.address}</span>
                                            <span className="mt-2 block font-mono text-[10px] tracking-wide text-command-emerald">{hospital.hospital_code}</span>
                                        </span>
                                        <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                                            selected ? 'border-command-emerald bg-command-emerald shadow-[inset_0_0_0_3px_#0c100f]' : 'border-white/30'
                                        }`} aria-hidden="true" />
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <button
                        onClick={handleConfirm}
                        disabled={!patientReport.trim() || !hospitalId || loading || hospitalsLoading}
                        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white py-4 rounded-full font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all duration-200"
                    >
                        <CheckCircle2 size={21} />
                        {loading ? 'ACTIVATING...' : 'CONFIRM & START EMERGENCY'}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="glass-pill w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                    >
                        <XCircle size={19} />
                        Cancel / Edit Report
                    </button>

                </div>

                <p className="text-center text-[11px] text-command-muted leading-5">
                    Please confirm only when an actual emergency ride
                    is ready to begin.
                </p>

            </main>
        </div>
    )
}

export default ConfirmationPage
