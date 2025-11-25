import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import Navbar from "~/components/Navbar";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [kvCount, setKvCount] = useState<number>(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"wipe" | "delete" | null>(null);
    const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const loadState = async () => {
        const f = (await fs.readDir("./")) as FSItem[] | undefined;
        setFiles(f ?? []);
        const list = (await kv.list("*")) as string[] | KVItem[] | undefined;
        setKvCount(Array.isArray(list) ? list.length : 0);
    };

    useEffect(() => {
        loadState();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const filteredFiles = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return files;
        return files.filter((f) => f.name.toLowerCase().includes(q));
    }, [files, query]);

    const hasSelection = selected.size > 0;
    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAllVisible = () => {
        setSelected(new Set(filteredFiles.map((f) => f.id)));
    };
    const clearSelection = () => setSelected(new Set());

    const handleWipe = async () => {
        setIsDeleting(true);
        setStatusType("idle");
        setStatusMsg("Wiping app data...");
        try {
            for (const file of files) {
                await fs.delete(file.path);
            }
            await kv.flush();
            await loadState();
            setStatusType("success");
            setStatusMsg("All app data wiped successfully");
        } catch (e: any) {
            const msg = e?.message ?? "Failed to wipe app data";
            setStatusType("error");
            setStatusMsg(msg);
        } finally {
            setIsDeleting(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const handleDeleteSelected = async () => {
        setIsDeleting(true);
        setStatusType("idle");
        setStatusMsg("Deleting selected files...");
        try {
            const toDelete = files.filter((f) => selected.has(f.id));
            for (const file of toDelete) {
                await fs.delete(file.path);
            }
            await loadState();
            setSelected(new Set());
            setStatusType("success");
            setStatusMsg("Selected files deleted");
        } catch (e: any) {
            const msg = e?.message ?? "Failed to delete selected files";
            setStatusType("error");
            setStatusMsg(msg);
        } finally {
            setIsDeleting(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    if (isLoading) {
        return (
            <main>
                <Navbar />
                <section className="main-section">
                    <div className="page-heading">
                        <h2>Loading...</h2>
                    </div>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main>
                <Navbar />
                <section className="main-section">
                    <div className="page-heading w-full max-w-2xl">
                        <div className="alert-error w-full" role="alert">
                            <span>Error</span>
                            <span>{error}</span>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading">
                    <h1>Manage App Data</h1>
                    <h2>Review stored files and safely clear your local data</h2>
                    <div className="text-sm text-gray-500">Authenticated as {auth.user?.username}</div>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card lg:col-span-2 transition-all">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="text-lg font-semibold">Stored Files</div>
                            <div className="text-sm text-gray-500">{files.length} items</div>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search files"
                                aria-label="Search files"
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <button className="secondary-button" onClick={selectAllVisible} aria-label="Select all visible files">Select All</button>
                            <button className="secondary-button" onClick={clearSelection} aria-label="Clear selection">Clear Selection</button>
                        </div>
                        <div className="flex flex-col gap-3" aria-live="polite" role="region">
                            {filteredFiles.length === 0 ? (
                                <div className="text-gray-500">No files found</div>
                            ) : (
                                filteredFiles.map((file) => (
                                    <div key={file.id} className={`flex items-center justify-between p-3 rounded-2xl ${selected.has(file.id) ? "bg-indigo-50" : "bg-gray-50"}`} aria-selected={selected.has(file.id)}>
                                        <div className="flex items-center gap-3">
                                            <img src="/icons/info.svg" alt="item" className="w-5 h-5" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[480px]">{file.name}</span>
                                                <span className="text-xs text-gray-500">{file.path}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-xs text-gray-400">{file.size ? `${file.size} bytes` : ""}</div>
                                            <input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file.id)} aria-label={`Select ${file.name}`} className="w-6 h-6" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">Data Summary</div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                <div className="text-sm text-gray-600">Files</div>
                                <div className="text-sm font-semibold">{files.length}</div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                <div className="text-sm text-gray-600">KV keys</div>
                                <div className="text-sm font-semibold">{kvCount}</div>
                            </div>
                        </div>

                        {statusType === "success" && statusMsg && (
                            <div className="alert-success" role="status" aria-live="polite">
                                <img src="/icons/check.svg" alt="success" className="w-5 h-5" />
                                <span>{statusMsg}</span>
                            </div>
                        )}
                        {statusType === "error" && statusMsg && (
                            <div className="alert-error" role="alert" aria-live="assertive">
                                <img src="/icons/warning.svg" alt="error" className="w-5 h-5" />
                                <span>{statusMsg}</span>
                            </div>
                        )}

                        <button
                            className="danger-button"
                            onClick={() => { setConfirmAction("wipe"); setConfirmOpen(true); }}
                            disabled={isDeleting}
                            aria-disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    Wiping...
                                </span>
                            ) : (
                                <span>Wipe App Data</span>
                            )}
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() => loadState()}
                            disabled={isDeleting}
                            aria-disabled={isDeleting}
                        >
                            Refresh
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() => { if (hasSelection) { setConfirmAction("delete"); setConfirmOpen(true); } }}
                            disabled={isDeleting || !hasSelection}
                            aria-disabled={isDeleting || !hasSelection}
                        >
                            Delete Selected Files
                        </button>
                    </div>
                </div>

                {confirmOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="card w-[560px] max-w-[95vw]" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                            <div className="flex flex-col gap-4">
                                <div id="confirm-title" className="text-xl font-semibold">{confirmAction === "delete" ? "Delete Selected Files" : "Confirm Wipe"}</div>
                                <div className="text-gray-600">{confirmAction === "delete" ? `This will delete ${selected.size} selected files.` : "This action will delete all stored files and clear app data. This cannot be undone."}</div>
                                <div className="flex items-center gap-3">
                                    <button className="secondary-button" onClick={() => setConfirmOpen(false)} disabled={isDeleting} aria-disabled={isDeleting}>Cancel</button>
                                    <button className="danger-button" onClick={confirmAction === "delete" ? handleDeleteSelected : handleWipe} disabled={isDeleting} aria-disabled={isDeleting}>Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
};

export default WipeApp;