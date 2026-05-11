import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const workoutTypes = [
    { label: "Cardio", emoji: "🏃" }, { label: "Weights", emoji: "🏋️" },
    { label: "Yoga", emoji: "🧘" }, { label: "Swimming", emoji: "🏊" },
    { label: "Cycling", emoji: "🚴" }, { label: "HIIT", emoji: "🔥" },
    { label: "Sports", emoji: "⚽" }, { label: "Walking", emoji: "🚶" },
    { label: "Pilates", emoji: "🤸" }, { label: "Other", emoji: "💪" },
];
const intensityColors = {
    "Very Light": "#81c784", "Light": "#5cb85c",
    "Moderate": "#f0ad4e", "Hard": "#e8845a", "Max Effort": "#d9534f",
};

function getMonthData(year, month) {
    return { firstDay: new Date(year, month, 1).getDay(), daysInMonth: new Date(year, month + 1, 0).getDate() };
}
function buildEntryMap(entries) {
    const map = {};
    entries.forEach(e => { const d = new Date(e.date); map[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = e; });
    return map;
}
function getTypeEmojis(types) {
    return types.map(t => { const f = workoutTypes.find(w => w.label === t.name); return f ? f.emoji : ""; }).join(" ");
}

function MonthView({ year, month, entryMap, today, onDayClick }) {
    const { firstDay, daysInMonth } = getMonthData(year, month);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {DAYS.map(d => <div key={d} className="cal-day-header" style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", padding: "8px 0", borderRadius: "8px" }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: `repeat(${Math.ceil(cells.length / 7)}, 1fr)`, gap: "6px", flex: 1 }}>
                {cells.map((day, i) => {
                    const entry = day ? entryMap[`${year}-${month}-${day}`] : null;
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const bg = entry ? (intensityColors[entry.intensity] || "rgba(74,144,217,0.82)") : day ? "rgba(255,255,255,0.06)" : "transparent";
                    return (
                        <div key={i} onClick={() => day && onDayClick(day - 1)} style={{ borderRadius: "10px", background: bg, border: isToday ? "2px solid white" : "1px solid rgba(255,255,255,0.15)", padding: day ? "8px 10px" : 0, boxSizing: "border-box", minHeight: "80px", cursor: day ? "pointer" : "default" }}>
                            {day && <>
                                <div className={entry ? "" : "cal-text"} style={{ fontWeight: 700, fontSize: "0.9rem", color: entry ? "white" : "inherit", textShadow: entry ? "0 1px 2px rgba(0,0,0,0.4)" : "none", marginBottom: "5px" }}>{day}</div>
                                {entry && <div style={{ fontSize: "0.75rem", color: "white", lineHeight: 1.6, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                                    <div>{entry.types && getTypeEmojis(entry.types)} {entry.types && entry.types.map(t => t.name).join(", ")}</div>
                                    <div>⏱️ {entry.duration}min | {entry.intensity}</div>
                                </div>}
                            </>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function WeekView({ year, month, entryMap, today, weekOffset }) {
    const start = new Date(year, month, 1);
    start.setDate(1 - start.getDay() + weekOffset * 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {weekDays.map((d, i) => <div key={i} className="cal-day-header" style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", padding: "10px 0", borderRadius: "8px", border: d.toDateString() === today.toDateString() ? "2px solid white" : "none" }}><div>{DAYS_SHORT[i]}</div><div style={{ fontSize: "1.3rem" }}>{d.getDate()}</div></div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", flex: 1 }}>
                {weekDays.map((d, i) => {
                    const entry = entryMap[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`];
                    return (
                        <div key={i} style={{ borderRadius: "10px", background: entry ? (intensityColors[entry.intensity] || "rgba(74,144,217,0.82)") : "rgba(255,255,255,0.06)", padding: "12px 10px", minHeight: "200px", border: "1px solid rgba(255,255,255,0.15)" }}>
                            {entry ? <div style={{ fontSize: "0.85rem", color: "white", lineHeight: 1.7, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                                <div>{entry.types && getTypeEmojis(entry.types)} <strong>{entry.types && entry.types.map(t => t.name).join(", ")}</strong></div>
                                <div>⏱️ {entry.duration} mins</div>
                                <div>💪 {entry.intensity}</div>
                                {entry.notes && <div style={{ marginTop: "6px", fontStyle: "italic", opacity: 0.9 }}>{entry.notes.slice(0, 80)}{entry.notes.length > 80 ? "..." : ""}</div>}
                            </div> : <div className="cal-text" style={{ fontSize: "0.8rem", opacity: 0.4, marginTop: "8px" }}>No entry</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DayView({ year, month, entryMap, today, dayOffset }) {
    const base = new Date(year, month, 1 + dayOffset);
    const entry = entryMap[`${base.getFullYear()}-${base.getMonth()}-${base.getDate()}`];
    const isToday = base.toDateString() === today.toDateString();
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="cal-day-header" style={{ textAlign: "center", padding: "16px", borderRadius: "12px", border: isToday ? "2px solid white" : "none" }}>
                <div className="cal-text" style={{ fontSize: "1rem", fontWeight: 700 }}>{DAYS[base.getDay()]}</div>
                <div className="cal-text" style={{ fontSize: "2.5rem", fontWeight: 800 }}>{base.getDate()}</div>
                <div className="cal-text" style={{ fontSize: "0.9rem" }}>{MONTH_NAMES[base.getMonth()]} {base.getFullYear()}</div>
            </div>
            <div style={{ flex: 1, borderRadius: "12px", background: entry ? (intensityColors[entry.intensity] || "rgba(74,144,217,0.82)") : "rgba(255,255,255,0.06)", padding: "24px", border: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", gap: "12px" }}>
                {entry ? <>
                    <p style={{ color: "white", fontSize: "1.2rem", margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{entry.types && getTypeEmojis(entry.types)} <strong>{entry.types && entry.types.map(t => t.name).join(", ")}</strong></p>
                    <p style={{ color: "white", fontSize: "1rem", margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>⏱️ Duration: {entry.duration} minutes</p>
                    <p style={{ color: "white", fontSize: "1rem", margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>💪 Intensity: {entry.intensity}</p>
                    {entry.notes && <p style={{ color: "white", fontSize: "1rem", margin: 0, lineHeight: 1.6, textShadow: "0 1px 2px rgba(0,0,0,0.4)", fontStyle: "italic" }}>"{entry.notes}"</p>}
                </> : <p className="cal-text" style={{ opacity: 0.5, fontSize: "1rem" }}>No workout logged for this day.</p>}
            </div>
        </div>
    );
}

function WorkoutJournalCalendar() {
    const navigate = useNavigate();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [view, setView] = useState("month");
    const [weekOffset, setWeekOffset] = useState(0);
    const [dayOffset, setDayOffset] = useState(0);
    const [entryMap, setEntryMap] = useState({});
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (userId) {
            api.get(`/workout/${userId}`)
            .then(res => setEntryMap(buildEntryMap(res.data)))
            .catch(err => console.log(err));
        }
    }, [userId]);

    function handleDayClick(offset) { setDayOffset(offset); setView("day"); }

    function prevPeriod() {
        if (view === "month") { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
        else if (view === "week") setWeekOffset(w => w - 1);
        else setDayOffset(d => d - 1);
    }
    function nextPeriod() {
        if (view === "month") { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
        else if (view === "week") setWeekOffset(w => w + 1);
        else setDayOffset(d => d + 1);
    }
    function periodLabel() {
        if (view === "month") return `${MONTH_NAMES[month]} ${year}`;
        if (view === "week") {
            const s = new Date(year, month, 1); s.setDate(1 - s.getDay() + weekOffset * 7);
            const e = new Date(s); e.setDate(s.getDate() + 6);
            return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}`;
        }
        const d = new Date(year, month, 1 + dayOffset);
        return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    return (
        <div style={{ minHeight: "100vh", width: "100%", boxSizing: "border-box", padding: "32px 40px", fontFamily: "Shrikhand, sans-serif", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <button className="back-btn" onClick={() => navigate("/workout")}>← Back</button>
                <h1 className="home-title" style={{ fontSize: "2rem", margin: 0, flex: 1, textAlign: "center" }}>Workout Calendar View</h1>
                <div style={{ display: "flex", gap: "8px" }}>
                    {["month","week","day"].map(v => (
                        <button key={v} className={view === v ? "login-btn" : "back-btn"} style={{ padding: "8px 18px" }} onClick={() => setView(v)}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
                <button className="back-btn" onClick={prevPeriod} style={{ fontSize: "1.4rem", padding: "4px 14px" }}>‹</button>
                <span className="home-title" style={{ fontSize: "1.5rem", margin: 0 }}>{periodLabel()}</span>
                <button className="back-btn" onClick={nextPeriod} style={{ fontSize: "1.4rem", padding: "4px 14px" }}>›</button>
            </div>

            {view === "month" && <MonthView year={year} month={month} entryMap={entryMap} today={today} onDayClick={handleDayClick} />}
            {view === "week" && <WeekView year={year} month={month} entryMap={entryMap} today={today} weekOffset={weekOffset} />}
            {view === "day" && <DayView year={year} month={month} entryMap={entryMap} today={today} dayOffset={dayOffset} />}

            <div style={{ display: "flex", gap: "16px", marginTop: "20px", justifyContent: "center", paddingBottom: "16px", flexWrap: "wrap" }}>
                {[{ color: "#81c784", label: "Very Light" }, { color: "#5cb85c", label: "Light" }, { color: "#f0ad4e", label: "Moderate" }, { color: "#e8845a", label: "Hard" }, { color: "#d9534f", label: "Max Effort" }].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "18px", height: "18px", borderRadius: "4px", background: color }} />
                        <span className="cal-legend-label">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WorkoutJournalCalendar;