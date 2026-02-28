"use client";

import {
    useEffect, useRef, useState, useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Pencil, Square, Circle, Minus, Type, StickyNote,
    Eraser, MousePointer2, Trash2, Download, Undo2, Redo2,
    ArrowUpRight, Highlighter, ZoomIn, ZoomOut, Grid,
    Image as ImageIcon, CheckCircle2, X, Maximize, Minimize
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
type ToolId =
    | "select" | "pen" | "highlight" | "eraser"
    | "rect" | "circle" | "line" | "arrow"
    | "text" | "sticky" | "image";

type BgStyle = "dots" | "grid" | "lines" | "plain";

interface WBPoint { x: number; y: number; }

interface WBObject {
    id: string;
    type: ToolId;
    points?: WBPoint[];
    x?: number; y?: number;
    w?: number; h?: number;
    rx?: number; ry?: number;
    x2?: number; y2?: number;
    text?: string;
    color: string;
    strokeWidth: number;
    opacity: number;
    fill?: string;
    stickyColor?: string;
    imageUrl?: string;
    author?: string;
}

// ─── Config ──────────────────────────────────────────────────────

const PALETTE = [
    "#1c1c1e", "#5e5ce6", "#30d158", "#ff453a",
    "#ff9f0a", "#bf5af2", "#0a84ff", "#ff6b35",
    "#ffffff", "#ff375f",
];

const STICKY_COLORS = [
    "#fbbf24", "#34d399", "#60a5fa", "#f87171",
    "#a78bfa", "#fb923c",
];

const WIDTHS = [2, 4, 8, 16];

const KEY_MAP: Record<string, ToolId> = {
    v: "select", p: "pen", h: "highlight",
    e: "eraser", r: "rect", c: "circle",
    l: "line", a: "arrow", t: "text", s: "sticky",
};

// ─── Keyboard tooltip ────────────────────────────────────────────
const TOOL_DEFS: { id: ToolId; icon: React.ReactNode; label: string; key: string }[] = [
    { id: "select", icon: <MousePointer2 size={16} />, label: "Select", key: "V" },
    { id: "pen", icon: <Pencil size={16} />, label: "Pen", key: "P" },
    { id: "highlight", icon: <Highlighter size={16} />, label: "Highlight", key: "H" },
    { id: "eraser", icon: <Eraser size={16} />, label: "Eraser", key: "E" },
    { id: "rect", icon: <Square size={16} />, label: "Rectangle", key: "R" },
    { id: "circle", icon: <Circle size={16} />, label: "Circle", key: "C" },
    { id: "line", icon: <Minus size={16} />, label: "Line", key: "L" },
    { id: "arrow", icon: <ArrowUpRight size={16} />, label: "Arrow", key: "A" },
    { id: "text", icon: <Type size={16} />, label: "Text", key: "T" },
    { id: "sticky", icon: <StickyNote size={16} />, label: "Sticky", key: "S" },
    { id: "image", icon: <ImageIcon size={16} />, label: "Image", key: "—" },
];

const CURSOR_MAP: Record<ToolId, string> = {
    select: "default", pen: "crosshair", highlight: "crosshair",
    eraser: "cell", rect: "crosshair", circle: "crosshair",
    line: "crosshair", arrow: "crosshair",
    text: "text", sticky: "copy", image: "copy",
};

// ─── Arrow-head helper ───────────────────────────────────────────
function drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number, headLen: number
) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 7),
        y2 - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 7),
        y2 - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW) { if (line) lines.push(line); line = w; }
        else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

// ─── Main Component ─────────────────────────────────────────────
export default function WhiteboardCanvas({ roomId, username, isActive }: { roomId: string; username: string; isActive: boolean }) {
    // ── Modal state ───────────────────────────────────────────────
    type ModalMode = "text" | "sticky" | "confirm-clear" | null;
    interface ModalState {
        mode: ModalMode;
        pendingPos?: WBPoint;
        pendingId?: string;
    }
    const [modal, setModal] = useState<ModalState>({ mode: null });
    const [modalInput, setModalInput] = useState("");

    // ── Toast state ───────────────────────────────────────────────
    interface Toast { id: number; message: string; }
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);
    function showToast(message: string) {
        const id = ++toastCounter.current;
        setToasts((t) => [...t, { id, message }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    }

    const [isFs, setIsFs] = useState(false);
    useEffect(() => {
        const handler = () => setIsFs(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    function toggleFs() {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => console.error("FS Error:", err));
        } else {
            document.exitFullscreen();
        }
    }

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Tools
    const [tool, setTool] = useState<ToolId>("pen");
    const [color, setColor] = useState("#1c1c1e");
    const [width, setWidth] = useState(3);
    const [opacity, setOpacity] = useState(1);
    const [fill, setFill] = useState<string>("transparent");
    const [bg, setBg] = useState<BgStyle>("dots");
    const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);

    // Objects & history
    const [objects, setObjects] = useState<WBObject[]>([]);
    const [history, setHistory] = useState<WBObject[][]>([]);
    const [redoStack, setRedoStack] = useState<WBObject[][]>([]);

    // Camera (zoom + pan)
    const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
    const [zoom, setZoom] = useState(1);

    // Drawing state
    const drawingRef = useRef(false);
    const spacePanRef = useRef(false);
    const panStartRef = useRef<WBPoint | null>(null);
    const currentObjRef = useRef<WBObject | null>(null);
    const startPosRef = useRef<WBPoint>({ x: 0, y: 0 });

    // ── ID generator ─────────────────────────────────────────────
    const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ── World ↔ screen coords ─────────────────────────────────────
    function screenToWorld(e: React.MouseEvent<HTMLCanvasElement>): WBPoint {
        const r = canvasRef.current!.getBoundingClientRect();
        const { x, y, scale } = cameraRef.current;
        return {
            x: (e.clientX - r.left - x) / scale,
            y: (e.clientY - r.top - y) / scale,
        };
    }

    // ── Draw background ───────────────────────────────────────────
    function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, cam: typeof cameraRef.current) {
        ctx.save();
        ctx.fillStyle = "#f2f2f7";
        ctx.fillRect(0, 0, w, h);

        if (bg === "plain") { ctx.restore(); return; }

        const { x, y, scale } = cam;
        const gap = 28 * scale;
        const offX = x % gap;
        const offY = y % gap;

        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 0.8;

        if (bg === "dots") {
            for (let px = offX; px < w; px += gap) {
                for (let py = offY; py < h; py += gap) {
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (bg === "grid") {
            for (let px = offX; px < w; px += gap) {
                ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
            }
            for (let py = offY; py < h; py += gap) {
                ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
            }
        } else if (bg === "lines") {
            for (let py = offY; py < h; py += gap) {
                ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
            }
        }
        ctx.restore();
    }

    // ── Draw one object ───────────────────────────────────────────
    function drawObject(ctx: CanvasRenderingContext2D, obj: WBObject) {
        ctx.save();
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.strokeStyle = obj.color;
        ctx.fillStyle = obj.fill || "transparent";
        ctx.lineWidth = obj.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (obj.type === "pen" || obj.type === "highlight") {
            if (obj.type === "highlight") {
                ctx.globalAlpha = (obj.opacity ?? 1) * 0.35;
                ctx.lineWidth = obj.strokeWidth * 4;
            }
            if (!obj.points || obj.points.length < 2) { ctx.restore(); return; }
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
                const prev = obj.points[i - 1], curr = obj.points[i];
                ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
            }
            ctx.stroke();

        } else if (obj.type === "eraser") {
            if (!obj.points || obj.points.length < 2) { ctx.restore(); return; }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = obj.strokeWidth * 5;
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
                const prev = obj.points[i - 1], curr = obj.points[i];
                ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
            }
            ctx.stroke();

        } else if (obj.type === "rect" && obj.w !== undefined) {
            ctx.beginPath();
            ctx.roundRect(obj.x!, obj.y!, obj.w!, obj.h!, 6);
            if (obj.fill !== "transparent") ctx.fill();
            ctx.stroke();

        } else if (obj.type === "circle" && obj.rx !== undefined) {
            ctx.beginPath();
            ctx.ellipse(obj.x!, obj.y!, obj.rx!, obj.ry!, 0, 0, Math.PI * 2);
            if (obj.fill !== "transparent") ctx.fill();
            ctx.stroke();

        } else if (obj.type === "line") {
            ctx.beginPath();
            ctx.moveTo(obj.x!, obj.y!);
            ctx.lineTo(obj.x2!, obj.y2!);
            ctx.stroke();

        } else if (obj.type === "arrow") {
            ctx.fillStyle = obj.color;
            drawArrow(ctx, obj.x!, obj.y!, obj.x2!, obj.y2!, obj.strokeWidth * 5);

        } else if (obj.type === "text" && obj.text) {
            const fs = Math.max(14, obj.strokeWidth * 5);
            ctx.font = `600 ${fs}px Inter, -apple-system, sans-serif`;
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = obj.opacity ?? 1;
            ctx.fillText(obj.text, obj.x!, obj.y!);

        } else if (obj.type === "sticky" && obj.text) {
            const padX = 16, padY = 14, fs = 14, lineH = fs + 6;
            ctx.font = `${fs}px Inter, sans-serif`;
            const bw = obj.w ?? 200;
            const lines = wrapText(ctx, obj.text, bw - padX * 2);
            const bh = lines.length * lineH + padY * 2 + 28;

            ctx.shadowColor = "rgba(0,0,0,0.12)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;

            ctx.fillStyle = obj.stickyColor ?? "#fbbf24";
            ctx.beginPath();
            ctx.roundRect(obj.x!, obj.y!, bw, bh, 10);
            ctx.fill();

            ctx.shadowColor = "transparent";

            ctx.fillStyle = "rgba(0,0,0,0.06)";
            ctx.beginPath();
            ctx.roundRect(obj.x!, obj.y!, bw, 26, [10, 10, 0, 0]);
            ctx.fill();

            ctx.fillStyle = "rgba(0,0,0,0.2)";
            [14, 24, 34].forEach((dx) => {
                ctx.beginPath();
                ctx.arc(obj.x! + dx, obj.y! + 13, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = "rgba(0,0,0,0.75)";
            ctx.font = `${fs}px Inter, sans-serif`;
            lines.forEach((ln, i) => {
                ctx.fillText(ln, obj.x! + padX, obj.y! + padY + 28 + i * lineH);
            });

        } else if (obj.type === "image" && obj.imageUrl) {
            const img = new window.Image();
            img.src = obj.imageUrl;
            if (img.complete) {
                ctx.drawImage(img, obj.x!, obj.y!, obj.w ?? 200, obj.h ?? 150);
            } else {
                ctx.strokeStyle = "#5e5ce6";
                ctx.lineWidth = 2;
                ctx.strokeRect(obj.x!, obj.y!, obj.w ?? 200, obj.h ?? 150);
                ctx.fillStyle = "rgba(94,92,230,0.06)";
                ctx.fillRect(obj.x!, obj.y!, obj.w ?? 200, obj.h ?? 150);
            }
        }
        ctx.restore();
    }

    // ── Full redraw ───────────────────────────────────────────────
    const redraw = useCallback((objs: WBObject[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const cam = cameraRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(ctx, canvas.width, canvas.height, cam);

        ctx.save();
        ctx.translate(cam.x, cam.y);
        ctx.scale(cam.scale, cam.scale);

        for (const obj of objs) drawObject(ctx, obj);

        ctx.restore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bg]);

    // ── Resize canvas ─────────────────────────────────────────────
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            redraw(objects);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [objects, redraw]);

    // ── Redraw on objects / bg change ─────────────────────────────
    useEffect(() => { redraw(objects); }, [objects, redraw]);

    // ── Keyboard shortcuts ────────────────────────────────────────
    // Helper: is any text-editable element currently focused anywhere on the page?
    function isEditableFocused() {
        const el = document.activeElement;
        if (!el) return false;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
        if ((el as HTMLElement).isContentEditable) return true;
        return false;
    }

    useEffect(() => {
        // Don't steal keyboard events when the whiteboard tab is not active
        if (!isActive) return;
        const down = (e: KeyboardEvent) => {
            // Disable ALL shortcuts while a modal is open
            if (modal.mode !== null) return;
            // Disable shortcuts when ANY editable element is focused
            if (isEditableFocused()) return;
            const k = e.key.toLowerCase();
            if (k === " ") { e.preventDefault(); spacePanRef.current = true; }
            if (KEY_MAP[k]) setTool(KEY_MAP[k]);
            if (e.ctrlKey || e.metaKey) {
                if (k === "z") { e.preventDefault(); undo(); }
            }
        };
        const up = (e: KeyboardEvent) => {
            if (modal.mode !== null) return;
            if (isEditableFocused()) return;
            if (e.key === " ") spacePanRef.current = false;
        };
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objects, modal.mode, isActive]);

    // ── Scroll to zoom ────────────────────────────────────────────
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.08 : 0.93;
            const cam = cameraRef.current;
            const r = el.getBoundingClientRect();
            const mx = e.clientX - r.left;
            const my = e.clientY - r.top;

            const newScale = Math.max(0.2, Math.min(8, cam.scale * factor));
            cam.x = mx - (mx - cam.x) * (newScale / cam.scale);
            cam.y = my - (my - cam.y) * (newScale / cam.scale);
            cam.scale = newScale;

            setZoom(newScale);
            redraw(objects);
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [objects, redraw]);

    // ── Realtime sync ─────────────────────────────────────────────
    useEffect(() => {
        async function fetchObjects() {
            const { data, error } = await supabase
                .from("whiteboard_objects").select("*")
                .eq("room_id", roomId).order("created_at", { ascending: true });
            if (error) { console.error("WB fetch:", error); return; }
            setObjects((data ?? []).map((r: any) => ({ ...r.data, id: r.object_id })));
        }
        fetchObjects();

        const ch = supabase.channel(`wb-${roomId}`)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "whiteboard_objects",
                filter: `room_id=eq.${roomId}`,
            }, (payload) => {
                if (payload.eventType === "INSERT") {
                    const obj: WBObject = { ...payload.new.data, id: payload.new.object_id };
                    setObjects((p) => p.some((o) => o.id === obj.id) ? p : [...p, obj]);
                } else if (payload.eventType === "UPDATE") {
                    const obj: WBObject = { ...payload.new.data, id: payload.new.object_id };
                    setObjects((p) => p.map((o) => o.id === obj.id ? obj : o));
                } else if (payload.eventType === "DELETE") {
                    setObjects((p) => p.filter((o) => o.id !== payload.old.object_id));
                }
            }).subscribe();

        return () => { supabase.removeChannel(ch); };
    }, [roomId]);

    // ── Persist ───────────────────────────────────────────────────
    async function persist(obj: WBObject) {
        const { id, ...data } = obj;
        await supabase.from("whiteboard_objects").upsert({ object_id: id, room_id: roomId, author: username, data });
    }
    async function deleteAll() {
        await supabase.from("whiteboard_objects").delete().eq("room_id", roomId);
        setObjects([]);
        showToast("Whiteboard cleared");
    }

    // ── History ───────────────────────────────────────────────────
    function saveHistory() { setHistory((h) => [...h, objects]); setRedoStack([]); }
    function undo() {
        setHistory((h) => {
            if (!h.length) return h;
            const prev = h[h.length - 1];
            setRedoStack((r) => [...r, objects]);
            setObjects(prev);
            return h.slice(0, -1);
        });
    }
    function redo() {
        setRedoStack((r) => {
            if (!r.length) return r;
            const next = r[r.length - 1];
            setHistory((h) => [...h, objects]);
            setObjects(next);
            return r.slice(0, -1);
        });
    }

    // ── Export ────────────────────────────────────────────────────
    function exportPNG() {
        const c = canvasRef.current;
        if (!c) return;
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `whiteboard-${roomId}.png`;
        a.click();
        showToast("Board exported as PNG");
    }

    // ── Image load ────────────────────────────────────────────────
    function handleImageFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const obj: WBObject = {
                id: genId(), type: "image", imageUrl,
                x: 100, y: 100, w: 300, h: 220,
                color: "#000", strokeWidth: 1, opacity: 1,
            };
            const img = new window.Image();
            img.onload = () => {
                const aspect = img.naturalWidth / img.naturalHeight;
                obj.w = 300; obj.h = Math.round(300 / aspect);
                saveHistory();
                setObjects((p) => [...p, obj]);
                persist(obj);
            };
            img.src = imageUrl;
        };
        reader.readAsDataURL(file);
    }

    // ── Mouse events ──────────────────────────────────────────────
    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (spacePanRef.current) {
            panStartRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = screenToWorld(e);
        drawingRef.current = true;
        const id = genId();

        if (tool === "pen" || tool === "highlight") {
            currentObjRef.current = {
                id, type: tool, points: [pos],
                color, strokeWidth: width, opacity,
            };
        } else if (tool === "eraser") {
            currentObjRef.current = {
                id, type: "eraser", points: [pos],
                color: "#000", strokeWidth: width, opacity: 1,
            };
        } else if (tool === "rect" || tool === "circle" || tool === "line" || tool === "arrow") {
            startPosRef.current = pos;
            currentObjRef.current = {
                id, type: tool, x: pos.x, y: pos.y,
                w: 0, h: 0, rx: 0, ry: 0, x2: pos.x, y2: pos.y,
                color, strokeWidth: width, opacity, fill,
            };
        } else if (tool === "text") {
            setModalInput("");
            setModal({ mode: "text", pendingPos: pos, pendingId: id });
            drawingRef.current = false;
        } else if (tool === "sticky") {
            setModalInput("");
            setModal({ mode: "sticky", pendingPos: pos, pendingId: id });
            drawingRef.current = false;
        } else if (tool === "image") {
            fileRef.current?.click();
            drawingRef.current = false;
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (spacePanRef.current && panStartRef.current) {
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            cameraRef.current.x += dx;
            cameraRef.current.y += dy;
            panStartRef.current = { x: e.clientX, y: e.clientY };
            redraw(objects);
            return;
        }

        if (!drawingRef.current || !currentObjRef.current) return;
        const pos = screenToWorld(e);
        const obj = currentObjRef.current;

        if (obj.type === "pen" || obj.type === "highlight" || obj.type === "eraser") {
            currentObjRef.current = { ...obj, points: [...(obj.points ?? []), pos] };
            redraw([...objects, currentObjRef.current]);
        } else if (obj.type === "rect") {
            currentObjRef.current = {
                ...obj,
                x: Math.min(startPosRef.current.x, pos.x),
                y: Math.min(startPosRef.current.y, pos.y),
                w: Math.abs(pos.x - startPosRef.current.x),
                h: Math.abs(pos.y - startPosRef.current.y),
            };
            redraw([...objects, currentObjRef.current]);
        } else if (obj.type === "circle") {
            const cx = (startPosRef.current.x + pos.x) / 2;
            const cy = (startPosRef.current.y + pos.y) / 2;
            currentObjRef.current = {
                ...obj, x: cx, y: cy,
                rx: Math.abs(pos.x - startPosRef.current.x) / 2,
                ry: Math.abs(pos.y - startPosRef.current.y) / 2,
            };
            redraw([...objects, currentObjRef.current]);
        } else if (obj.type === "line" || obj.type === "arrow") {
            currentObjRef.current = { ...obj, x2: pos.x, y2: pos.y };
            redraw([...objects, currentObjRef.current]);
        }
    };

    const onMouseUp = () => {
        panStartRef.current = null;
        if (!drawingRef.current || !currentObjRef.current) return;
        drawingRef.current = false;
        const obj = currentObjRef.current;
        saveHistory();
        setObjects((p) => [...p, obj]);
        persist(obj);
        currentObjRef.current = null;
    };

    // ── Zoom controls ─────────────────────────────────────────────
    const zoomBy = (factor: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cam = cameraRef.current;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const ns = Math.max(0.2, Math.min(8, cam.scale * factor));
        cam.x = cx - (cx - cam.x) * (ns / cam.scale);
        cam.y = cy - (cy - cam.y) * (ns / cam.scale);
        cam.scale = ns;
        setZoom(ns);
        redraw(objects);
    };
    const zoomReset = () => {
        cameraRef.current = { x: 0, y: 0, scale: 1 };
        setZoom(1);
        redraw(objects);
    };

    // ─── Cursor ────────────────────────────────────────────────────
    const cursor = spacePanRef.current ? "grab" : CURSOR_MAP[tool];

    // ── Modal submit handler ──────────────────────────────────────
    function submitModal() {
        const text = modalInput.trim();
        if (!text || !modal.pendingPos || !modal.pendingId) { setModal({ mode: null }); return; }
        const pos = modal.pendingPos;
        const id = modal.pendingId;

        if (modal.mode === "text") {
            const obj: WBObject = { id, type: "text", x: pos.x, y: pos.y, text, color, strokeWidth: width, opacity };
            saveHistory();
            setObjects((p) => [...p, obj]);
            persist(obj);
            showToast("Text added");
        } else if (modal.mode === "sticky") {
            const obj: WBObject = {
                id, type: "sticky", x: pos.x, y: pos.y, w: 200,
                text, color: "#000", strokeWidth: 1, opacity: 1, stickyColor,
            };
            saveHistory();
            setObjects((p) => [...p, obj]);
            persist(obj);
            showToast("Sticky note added");
        }
        setModal({ mode: null });
        setModalInput("");
    }

    return (
        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: "#f2f2f7", overflow: "hidden" }}>

            {/* Hidden file input for images */}
            <input
                ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
            />

            {/* ── Toast notifications ── */}
            <div style={{ position: "absolute", bottom: 80, right: 18, zIndex: 100, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
                {toasts.map((t) => (
                    <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "#0F172A", color: "#fff",
                        padding: "12px 18px", borderRadius: 14,
                        fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                        animation: "wb-slide-in 0.25s cubic-bezier(.22,1,.36,1)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        <CheckCircle2 size={15} color="#34d399" />
                        {t.message}
                    </div>
                ))}
            </div>

            {/* ── Input Modal (text / sticky) ── */}
            {(modal.mode === "text" || modal.mode === "sticky") && (
                <div
                    style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setModal({ mode: null }); }}
                >
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: "32px 28px", width: 380, maxWidth: "90vw",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                        animation: "wb-modal-in 0.2s cubic-bezier(.22,1,.36,1)",
                        display: "flex", flexDirection: "column", gap: 20,
                        border: "1px solid rgba(0,0,0,0.06)",
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                                    {modal.mode === "text" ? "Add Text" : "Add Sticky Note"}
                                </p>
                                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                                    {modal.mode === "text" ? "Type something to place on the board" : "Write your note content"}
                                </p>
                            </div>
                            <button onClick={() => setModal({ mode: null })} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Input */}
                        {modal.mode === "text" ? (
                            <input
                                autoFocus
                                value={modalInput}
                                onChange={(e) => setModalInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") submitModal(); if (e.key === "Escape") setModal({ mode: null }); }}
                                placeholder="Your text here…"
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    padding: "12px 14px", borderRadius: 10,
                                    border: "1.5px solid #e2e8f0", fontSize: 14,
                                    fontFamily: "Inter, sans-serif", fontWeight: 500,
                                    color: "#0F172A", outline: "none",
                                    transition: "border-color 0.15s",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#5e5ce6")}
                                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                            />
                        ) : (
                            <textarea
                                autoFocus
                                value={modalInput}
                                onChange={(e) => setModalInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setModal({ mode: null }); if (e.key === "Enter" && e.ctrlKey) submitModal(); }}
                                placeholder="Write your sticky note… (Ctrl+Enter to confirm)"
                                rows={4}
                                style={{
                                    width: "100%", boxSizing: "border-box", resize: "vertical",
                                    padding: "12px 14px", borderRadius: 10,
                                    border: "1.5px solid #e2e8f0", fontSize: 14,
                                    fontFamily: "Inter, sans-serif", fontWeight: 500,
                                    color: "#0F172A", outline: "none",
                                    transition: "border-color 0.15s", lineHeight: 1.6,
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#5e5ce6")}
                                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                            />
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setModal({ mode: null })} style={{
                                padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "transparent",
                                fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", color: "#64748b", cursor: "pointer",
                            }}>Cancel</button>
                            <button onClick={submitModal} style={{
                                padding: "10px 22px", borderRadius: 10, border: "none",
                                background: "#5e5ce6", color: "#fff",
                                fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", cursor: "pointer",
                                boxShadow: "0 4px 16px rgba(94,92,230,0.35)",
                                opacity: modalInput.trim() ? 1 : 0.45,
                            }}>Place on Board</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Clear Modal ── */}
            {modal.mode === "confirm-clear" && (
                <div
                    style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setModal({ mode: null }); }}
                >
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: "32px 28px", width: 360, maxWidth: "90vw",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                        animation: "wb-modal-in 0.2s cubic-bezier(.22,1,.36,1)",
                        display: "flex", flexDirection: "column", gap: 20,
                        border: "1px solid rgba(0,0,0,0.06)",
                    }}>
                        {/* Icon + Title */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,69,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Trash2 size={22} color="#ff453a" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>Clear Whiteboard?</p>
                                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 500, lineHeight: 1.5 }}>This will permanently delete all drawings and objects for everyone in this room.</p>
                            </div>
                        </div>
                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setModal({ mode: null })} style={{
                                flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "transparent",
                                fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", color: "#64748b", cursor: "pointer",
                            }}>Cancel</button>
                            <button onClick={() => { deleteAll(); setModal({ mode: null }); }} style={{
                                flex: 1, padding: "11px", borderRadius: 10, border: "none",
                                background: "#ff453a", color: "#fff",
                                fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", cursor: "pointer",
                                boxShadow: "0 4px 16px rgba(255,69,58,0.35)",
                            }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Keyframe styles ── */}
            <style>{`
                @keyframes wb-slide-in {
                    from { opacity: 0; transform: translateX(24px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes wb-modal-in {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            {/* ── Left toolbar (Tools) ── */}
            <div style={{
                position: "absolute", top: 20, left: 20,
                zIndex: 30, display: "flex", flexDirection: "column", gap: 3,
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14,
                padding: 6,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                maxHeight: "calc(100% - 100px)", overflowY: "auto",
            }}>
                {TOOL_DEFS.map((t, i) => {
                    const active = tool === t.id;
                    const showDiv = i === 4 || i === 9; // Grouping dividers
                    return (
                        <div key={t.id}>
                            {showDiv && <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "4px 2px" }} />}
                            <button
                                title={`${t.label} (${t.key})`}
                                onClick={() => setTool(t.id)}
                                style={{
                                    width: 32, height: 32, borderRadius: 8, border: "none",
                                    background: active ? "#5e5ce6" : "transparent",
                                    color: active ? "#fff" : "#6d6d72",
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.15s",
                                }}
                            >
                                {t.icon}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* ── Top right toolbar (Actions + Zoom) ── */}
            <div style={{
                position: "absolute", top: 20, right: 20,
                zIndex: 30, display: "flex", gap: 10, padding: "6px 14px",
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                alignItems: "center",
            }}>
                {/* Zoom Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#6d6d72", fontFamily: "Inter, sans-serif" }}>
                    <button onClick={() => zoomBy(0.8)} style={zoomBtnStyle}><ZoomOut size={14} /></button>
                    <span style={{ minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => zoomBy(1.2)} style={zoomBtnStyle}><ZoomIn size={14} /></button>
                </div>

                <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.07)" }} />

                {/* Undo / Redo */}
                <div style={{ display: "flex", gap: 4 }}>
                    <button title="Undo (Ctrl+Z)" onClick={undo} style={{ ...iconBtnLight, width: 30, height: 30 }}><Undo2 size={15} /></button>
                    <button title="Redo" onClick={redo} style={{ ...iconBtnLight, width: 30, height: 30 }}><Redo2 size={15} /></button>
                </div>

                <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.07)" }} />

                {/* Actions */}
                <div style={{ display: "flex", gap: 4 }}>
                    <button title="Fullscreen" onClick={toggleFs} style={iconBtnLight}>
                        {isFs ? <Minimize size={15} /> : <Maximize size={15} />}
                    </button>
                    <button title="Export PNG" onClick={exportPNG} style={{ ...iconBtnLight, width: 30, height: 30 }}><Download size={15} /></button>
                    <button title="Clear all" onClick={() => setModal({ mode: "confirm-clear" })} style={{ ...iconBtnLight, width: 30, height: 30, color: "#ff453a", background: "rgba(255,69,58,0.05)" }}>
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* ── Canvas ── */}
            <div ref={containerRef} style={{ flex: 1, width: "100%", height: "100%" }}>
                <canvas
                    ref={canvasRef}
                    style={{ cursor, display: "block" }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                />
            </div>

            {/* ── Bottom options bar ── */}
            <div style={{
                position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
                zIndex: 30, display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(0,0,0,0.08)", borderRadius: 32,
                padding: "8px 18px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                flexWrap: "wrap", maxWidth: "calc(100% - 40px)",
                justifyContent: "center",
            }}>
                {/* Colour swatches */}
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {PALETTE.map((c) => (
                        <button key={c} onClick={() => setColor(c)} style={{
                            width: 20, height: 20, borderRadius: "50%", background: c, border: "none",
                            outline: color === c ? "2px solid #5e5ce6" : "2px solid rgba(0,0,0,0.1)",
                            outlineOffset: 1, cursor: "pointer",
                            transform: color === c ? "scale(1.3)" : "scale(1)",
                            transition: "transform 0.1s",
                        }} />
                    ))}
                    {/* Custom colour picker */}
                    <label title="Custom colour" style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer" }} />
                    </label>
                </div>

                <div style={divider} />

                {/* Stroke widths */}
                {WIDTHS.map((w) => (
                    <button key={w} onClick={() => setWidth(w)} style={{
                        width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        outline: width === w ? "1.5px solid #5e5ce6" : "1.5px solid rgba(0,0,0,0.1)",
                    }}>
                        <div style={{ width: 16, height: w / 2, background: color, borderRadius: 99, minHeight: 1 }} />
                    </button>
                ))}

                <div style={divider} />

                {/* Opacity */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#aeaeb2", fontWeight: 700 }}>OPACITY</span>
                    <input type="range" min={0.1} max={1} step={0.05} value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        style={{ width: 64, accentColor: "#5e5ce6" }}
                    />
                    <span style={{ fontSize: 11, color: "#6d6d72", minWidth: 32 }}>{Math.round(opacity * 100)}%</span>
                </div>

                <div style={divider} />

                {/* Fill toggle (rect/circle only) */}
                {(tool === "rect" || tool === "circle") && (
                    <>
                        {(["transparent", color] as const).map((f) => (
                            <button key={String(f)} onClick={() => setFill(f === color ? color : "transparent")}
                                style={{
                                    ...smallBtn,
                                    background: fill === f ? "rgba(94,92,230,0.1)" : "transparent",
                                    outline: fill === f ? "1.5px solid #5e5ce6" : "1.5px solid rgba(0,0,0,0.1)",
                                    color: fill === f ? "#5e5ce6" : "#6d6d72",
                                }}>
                                {f === "transparent" ? "Outline" : "Filled"}
                            </button>
                        ))}
                        <div style={divider} />
                    </>
                )}

                {/* Sticky colour (sticky tool only) */}
                {tool === "sticky" && (
                    <>
                        {STICKY_COLORS.map((c) => (
                            <button key={c} onClick={() => setStickyColor(c)} style={{
                                width: 18, height: 18, borderRadius: 4, background: c, border: "none",
                                cursor: "pointer",
                                outline: stickyColor === c ? "2px solid #5e5ce6" : "2px solid rgba(0,0,0,0.08)",
                                outlineOffset: 1,
                            }} />
                        ))}
                        <div style={divider} />
                    </>
                )}

                {/* Background style */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#aeaeb2", fontWeight: 700 }}><Grid size={12} /></span>
                    {(["dots", "grid", "lines", "plain"] as BgStyle[]).map((b) => (
                        <button key={b} onClick={() => setBg(b)} style={{
                            ...smallBtn,
                            background: bg === b ? "rgba(94,92,230,0.1)" : "transparent",
                            outline: bg === b ? "1.5px solid #5e5ce6" : "1.5px solid rgba(0,0,0,0.1)",
                            color: bg === b ? "#5e5ce6" : "#6d6d72",
                            textTransform: "capitalize",
                        }}>
                            {b}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Keyboard shortcut chip (bottom left) ── */}
            <div style={{
                position: "absolute", bottom: 26, left: 24, zIndex: 30,
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10,
                padding: "5px 12px", fontSize: 10, color: "#94a3b8",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                letterSpacing: "0.02em", pointerEvents: "none",
            }}>
                SPACE + DRAG TO PAN · SCROLL TO ZOOM
            </div>
        </div>
    );
}

// ── Style helpers ─────────────────────────────────────────────
const iconBtnLight: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10, border: "none",
    background: "transparent", color: "#6d6d72", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
};

const divider: React.CSSProperties = {
    width: 1, height: 24, background: "rgba(0,0,0,0.08)", flexShrink: 0,
};

const smallBtn: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 8, border: "none",
    fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
    cursor: "pointer", transition: "all 0.15s",
};

const zoomBtnStyle: React.CSSProperties = {
    background: "transparent", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6d6d72", borderRadius: 6, padding: 3,
    transition: "background 0.1s",
};
