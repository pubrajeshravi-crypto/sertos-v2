
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
    Ambulance,
    ArrowLeft,
    CheckCircle2,
    Mic,
    ShieldAlert,
    XCircle,
} from 'lucide-react'
import { api, type Hospital } from '../../lib/api'

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
    const [error, setError] = useState('')

    useEffect(() => {
        api.getHospitals()
            .then((items) => {
                setHospitals(items)
                if (items[0]) setHospitalId(items[0].id)
            })
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load hospitals.'))
    }, [])

    const handleCancel = () => {
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
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'Unable to activate emergency.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">

                    <button
                        onClick={handleCancel}
                        className="p-2 rounded-xl bg-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="font-extrabold text-lg">
                            Emergency Confirmation
                        </h1>
                        <p className="text-xs text-slate-500">
                            Review before activating emergency
                        </p>
                    </div>

                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">

                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                        <ShieldAlert size={34} className="text-red-600" />
                    </div>

                    <h2 className="text-xl font-extrabold text-red-700 mt-4">
                        Confirm Emergency?
                    </h2>

                    <p className="text-sm text-red-600 mt-2 leading-6">
                        After confirmation, the emergency ride workflow
                        will start and the hospital and traffic alert
                        processes will be initiated.
                    </p>

                </div>

                {/* Voice Report */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-2 rounded-xl">
                            <Mic size={20} className="text-blue-600" />
                        </div>

                        <div>
                            <h3 className="font-bold text-sm">
                                Patient Voice Report
                            </h3>
                            <p className="text-xs text-slate-500">
                                Recorded speech transcript
                            </p>
                        </div>

                        <span className="ml-auto text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold">
                            CAPTURED
                        </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-28">
                        <p className="text-sm leading-7 whitespace-pre-wrap">
                            {patientReport || 'No patient report available.'}
                        </p>
                    </div>

                    {!patientReport.trim() && (
                        <p className="text-xs text-red-600">
                            A patient report is required before confirmation.
                        </p>
                    )}

                </div>

                {/* Activation Information */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">

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
                                <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center">
                                    <Icon size={20} className="text-red-600" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 leading-5">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}

                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                    <label className="block text-sm font-bold">
                        Destination hospital
                        <select
                            value={hospitalId}
                            onChange={(event) => setHospitalId(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"
                            disabled={loading}
                        >
                            <option value="">Select a hospital</option>
                            {hospitals.map((hospital) => (
                                <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                            ))}
                        </select>
                    </label>
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        onClick={handleConfirm}
                        disabled={!patientReport.trim() || !hospitalId || loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                    >
                        <CheckCircle2 size={21} />
                        {loading ? 'ACTIVATING...' : 'CONFIRM & START EMERGENCY'}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                        <XCircle size={19} />
                        Cancel / Edit Report
                    </button>

                </div>

                <p className="text-center text-[11px] text-slate-400 leading-5">
                    Please confirm only when an actual emergency ride
                    is ready to begin.
                </p>

            </main>
        </div>
    )
}

export default ConfirmationPage
