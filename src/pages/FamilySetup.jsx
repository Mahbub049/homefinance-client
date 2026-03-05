import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";

export default function FamilySetup() {
    const nav = useNavigate();
    const [family, setFamily] = useState(null);
    const [createName, setCreateName] = useState("");
    const [invite, setInvite] = useState("");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        api.get("/api/family/me").then((res) => {
            setFamily(res.data.family);
        });
    }, []);

    async function createFamily() {
        setMsg("");
        try {
            const res = await api.post("/api/family/create", { name: createName });
            setFamily(res.data.family);
            nav("/", { replace: true });
        } catch (e) {
            setMsg(e?.response?.data?.message || "Create failed");
        }
    }

    async function joinFamily() {
        setMsg("");
        try {
            const res = await api.post("/api/family/join", { inviteCode: invite });
            setFamily(res.data.family);
            nav("/", { replace: true });
        } catch (e) {
            setMsg(e?.response?.data?.message || "Join failed");
        }
    }

    return (
        <AppLayout>
            <div className="max-w-3xl">
                <h2 className="text-2xl font-bold mb-2">Family Setup</h2>
                <p className="text-gray-600 mb-6">
                    Create a family (first user) or join using invite code (second user).
                </p>

                {family && (
                    <div className="mb-6 bg-white border rounded-lg p-4">
                        <h3 className="font-semibold mb-1">Your Family Workspace</h3>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Name:</span> {family.name}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Invite Code:</span> {family.inviteCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Share this invite code with your wife so she can join.
                        </p>
                    </div>
                )}

                {msg && <div className="mb-4 text-sm text-red-600">{msg}</div>}

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Create Family</h3>
                        <input
                            className="w-full border rounded-md px-3 py-2 mb-3"
                            placeholder="Family name (e.g., Mahbub Family)"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                        />
                        <button
                            onClick={createFamily}
                            className="w-full bg-black text-white rounded-md py-2"
                            disabled={!!family || !createName.trim()}
                        >
                            Create
                        </button>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Join Family</h3>
                        <input
                            className="w-full border rounded-md px-3 py-2 mb-3"
                            placeholder="Invite code (e.g., A1B2C3D4)"
                            value={invite}
                            onChange={(e) => setInvite(e.target.value)}
                        />
                        <button
                            onClick={joinFamily}
                            className="w-full bg-black text-white rounded-md py-2"
                            disabled={!!family || !invite.trim()}
                        >
                            Join
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                    Tip: After creating a family, you will see an invite code in the next sprint (Scrum 2 UI improvement).
                </div>
            </div>
        </AppLayout>
    );
}