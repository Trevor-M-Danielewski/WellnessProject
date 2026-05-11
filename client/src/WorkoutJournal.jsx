import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./Api";

const workoutTypes = [
    { label: "Cardio", emoji: "🏃" },
    { label: "Weights", emoji: "🏋️" },
    { label: "Yoga", emoji: "🧘" },
    { label: "Swimming", emoji: "🏊" },
    { label: "Cycling", emoji: "🚴" },
    { label: "HIIT", emoji: "🔥" },
    { label: "Sports", emoji: "⚽" },
    { label: "Walking", emoji: "🚶" },
    { label: "Pilates", emoji: "🤸" },
    { label: "Other", emoji: "💪" },
];

const intensityOptions = [
    { label: "Very Light", emoji: "🌱" },
    { label: "Light", emoji: "😊" },
    { label: "Moderate", emoji: "😤" },
    { label: "Hard", emoji: "🥵" },
    { label: "Max Effort", emoji: "💀" },
];

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function LineChart({ data }) {
    const effectiveMax = Math.max(...data.map(d => d.avg), 1);
    const w = 260;
    const h = 90;
    const padX = 16;
    const padY = 16;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2 - 14;

    const pts = data.map((d, i) => ({
        x: padX + (i / Math.max(data.length - 1, 1)) * plotW,
        y: padY + plotH - (d.avg / effectiveMax) * plotH,
    }));

    const path = pts.map((p, i) => (i === 0 ? "M" : "L") + " " + p.x + " " + p.y).join(" ");

    return (
        <svg viewBox={"0 0 " + w + " " + h} style={{ width: "100%" }}>
            <path d={path} fill="none" stroke="var(--button-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--button-bg)" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-color)" fontSize="9" fontWeight="bold">{data[i].avg}m</text>
                    <text x={p.x} y={h - 1} textAnchor="middle" fill="var(--text-color)" fontSize="9" opacity="0.6">{data[i].month}</text>
                </g>
            ))}
        </svg>
    );
}

function WorkoutJournal() {
    const navigate = useNavigate();

    const [selectedTypes, setSelectedTypes] = useState([]);
    const [duration, setDuration] = useState("");
    const [useCustomDuration, setUseCustomDuration] = useState(false);
    const [intensity, setIntensity] = useState(null);
    const [notes, setNotes] = useState("");
    const [entries, setEntries] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (userId) {
            api.get(`/workout/${userId}`)
            .then(res => setEntries(res.data))
            .catch(err => console.log(err))
        }
    }, [userId]);

    // --- derived chart data from entries ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = dayLabels.map((day, i) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        const total = entries
            .filter(e => {
                const d = new Date(e.date);
                return (
                    d.getFullYear() === dayDate.getFullYear() &&
                    d.getMonth() === dayDate.getMonth() &&
                    d.getDate() === dayDate.getDate()
                );
            })
            .reduce((sum, e) => sum + (e.duration || 0), 0);
        return { day: day, duration: total };
    });

    const typeCounts = {};
    entries.forEach(e => {
        if (e.types) {
            e.types.forEach(t => {
                typeCounts[t.name] = (typeCounts[t.name] || 0) + 1;
            });
        }
    });
    const totalTypeCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    const typeData = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(pair => {
            const name = pair[0];
            const count = pair[1];
            const found = workoutTypes.find(w => w.label === name);
            return {
                name: name,
                pct: totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0,
                emoji: found ? found.emoji : "💪",
            };
        });

    const trendData = [];
    for (let i = 3; i >= 0; i--) {
        const ref = new Date();
        ref.setDate(1);
        ref.setMonth(ref.getMonth() - i);
        const m = ref.getMonth();
        const yr = ref.getFullYear();
        const monthEntries = entries.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === m && d.getFullYear() === yr;
        });
        const avg = monthEntries.length > 0
            ? Math.round(monthEntries.reduce((s, e) => s + (e.duration || 0), 0) / monthEntries.length)
            : 0;
        trendData.push({ month: monthNames[m], avg: avg });
    }

    const thisWeekCount = entries.filter(e => new Date(e.date) >= weekStart).length;

    const avgDuration = entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + (e.duration || 0), 0) / entries.length)
        : 0;

    function computeStreak() {
        const dateSet = new Set(entries.map(e => {
            const d = new Date(e.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }));
        let streak = 0;
        const check = new Date();
        check.setHours(0, 0, 0, 0);
        while (dateSet.has(check.getTime())) {
            streak++;
            check.setDate(check.getDate() - 1);
        }
        return streak;
    }
    const streak = computeStreak();

    const maxBar = Math.max(...weeklyData.map(d => d.duration), 1);

    function toggleType(typeLabel) {
        if (selectedTypes.includes(typeLabel)) {
            setSelectedTypes(selectedTypes.filter(t => t !== typeLabel));
        } else {
            setSelectedTypes([...selectedTypes, typeLabel]);
        }
    }

    function handleDurationChange(e) {
        if (e.target.value === "custom") {
            setUseCustomDuration(true);
            setDuration("");
        } else {
            setUseCustomDuration(false);
            setDuration(e.target.value);
        }
    }

    function handleSubmit() {
        if (selectedTypes.length === 0) { alert("Please select at least one workout type!"); return; }
        if (!duration) { alert("Please enter a duration!"); return; }
        if (!intensity) { alert("Please select an intensity!"); return; }

        const newEntry = {
            userId: userId,
            types: selectedTypes.map(t => ({ name: t })),
            duration: Number(duration),
            intensity: intensity.label,
            notes: notes,
        };

        api.post("/workout", newEntry)
        .then(() => api.get(`/workout/${userId}`))
        .then(res => {
            setEntries(res.data);
            setSelectedTypes([]);
            setDuration("");
            setUseCustomDuration(false);
            setIntensity(null);
            setNotes("");
            setSubmitted(true);
            setTimeout(() => { setSubmitted(false); }, 3000);
        })
        .catch(err => console.log(err))
    }

    return (
        <div className="home-container" style={{ alignItems: "stretch", justifyContent: "flex-start", padding: "16px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <button className="back-btn" onClick={() => navigate("/home")}>← Back</button>
                <h1 className="home-title" style={{ fontSize: "1.8rem", margin: 0 }}>💪 Workout Journal</h1>
                <button className="back-btn" onClick={() => navigate("/workout/calendar")}>📅 Calendar</button>
            </div>

            {/* Main 2-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "14px", alignItems: "start" }}>

                {/* LEFT — Log form */}
                <div className="home-card" style={{ padding: "18px", gap: "12px", alignItems: "stretch" }}>
                    <p className="login-label" style={{ fontSize: "0.95rem", margin: 0 }}>Log Today's Workout</p>

                    {/* Workout type selector */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "8px" }}>Workout Type</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", justifyContent: "center" }}>
                            {workoutTypes.map(type => (
                                <div
                                    key={type.label}
                                    onClick={() => toggleType(type.label)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "7px 9px",
                                        borderRadius: "12px",
                                        background: selectedTypes.includes(type.label) ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        border: selectedTypes.includes(type.label) ? "2px solid white" : "2px solid transparent",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "2px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <span style={{ fontSize: "1.4rem" }}>{type.emoji}</span>
                                    <span className="journal-label" style={{ fontSize: "0.65rem" }}>{type.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Duration + Intensity side by side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "start" }}>
                        <div>
                            <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Duration (min)</p>
                            <select
                                className="login-input"
                                style={{ width: "100%", boxSizing: "border-box", marginBottom: useCustomDuration ? "6px" : 0, cursor: "pointer" }}
                                value={useCustomDuration ? "custom" : (duration || "")}
                                onChange={handleDurationChange}
                            >
                                <option value="">Select...</option>
                                {[5,10,15,20,25,30,35,40,45,50,55,60,75,90,120].map(v => (
                                    <option key={v} value={v}>{v} min</option>
                                ))}
                                <option value="custom">Custom...</option>
                            </select>
                            {useCustomDuration && (
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter minutes"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="login-input"
                                    style={{ width: "100%", boxSizing: "border-box", marginBottom: 0 }}
                                />
                            )}
                        </div>
                        <div>
                            <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Intensity</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {intensityOptions.map(option => (
                                    <div
                                        key={option.label}
                                        onClick={() => setIntensity(option)}
                                        style={{
                                            cursor: "pointer",
                                            padding: "5px 8px",
                                            borderRadius: "8px",
                                            background: intensity?.label === option.label ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                            border: intensity?.label === option.label ? "2px solid white" : "2px solid transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.15s",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span className="text-color">{option.emoji} {option.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Notes</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did it go? Any PRs, struggles..."
                            rows={3}
                            className="text-color"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "10px",
                                border: "none",
                                background: "rgba(255,255,255,0.2)",
                                fontSize: "0.88rem",
                                fontFamily: "arial, sans-serif",
                                resize: "vertical",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <button className="login-btn" onClick={handleSubmit}>Save Entry</button>
                    {submitted && (
                        <p className="text-color" style={{ fontWeight: 700, margin: 0, textAlign: "center" }}>✅ Entry saved!</p>
                    )}
                </div>

                {/* RIGHT — Stats & Charts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                    {/* Quick stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {[
                            { label: "This Week", value: String(thisWeekCount), sub: "workouts", icon: "🏋️" },
                            { label: "Avg Duration", value: entries.length > 0 ? avgDuration + " min" : "—", sub: "per session", icon: "⏱️" },
                            { label: "Streak", value: streak > 0 ? streak + (streak === 1 ? " day" : " days") : "—", sub: streak > 0 ? "keep going!" : "start today!", icon: "🔥" },
                        ].map(s => (
                            <div key={s.label} className="home-card" style={{ padding: "12px 8px", gap: "4px" }}>
                                <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
                                <div className="login-label" style={{ fontSize: "1rem", margin: 0 }}>{s.value}</div>
                                <div className="text-color" style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.6 }}>{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Weekly activity bar chart */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📅 Weekly Activity</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                            {weeklyData.map(d => (
                                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "4px", height: "100%" }}>
                                    <span className="text-color" style={{ fontSize: "0.58rem", fontWeight: 700, height: "12px", opacity: 0.7 }}>
                                        {d.duration > 0 ? d.duration + "m" : ""}
                                    </span>
                                    <div style={{
                                        width: "100%",
                                        height: (d.duration > 0 ? Math.max((d.duration / maxBar) * 60, 10) : 4) + "px",
                                        background: d.duration > 0 ? "var(--button-bg)" : "rgba(0,0,0,0.1)",
                                        borderRadius: "5px 5px 2px 2px",
                                        opacity: d.duration > 0 ? 1 : 0.4,
                                    }} />
                                    <span className="text-color" style={{ fontSize: "0.6rem", fontWeight: 700 }}>{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Workout type breakdown */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>🏆 Workout Breakdown</p>
                        {typeData.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                                {typeData.map(t => (
                                    <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "20px", textAlign: "center", fontSize: "0.9rem" }}>{t.emoji}</span>
                                        <div style={{ flex: 1, height: "9px", background: "rgba(0,0,0,0.1)", borderRadius: "5px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: t.pct + "%", background: "var(--button-bg)", borderRadius: "5px", opacity: 0.6 + t.pct / 100 }} />
                                        </div>
                                        <span className="text-color" style={{ fontSize: "0.72rem", fontWeight: 700, width: "28px", textAlign: "right" }}>{t.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-color" style={{ fontSize: "0.8rem", opacity: 0.6, margin: 0 }}>Log workouts to see your breakdown</p>
                        )}
                    </div>

                    {/* Duration trend line chart */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "6px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📈 Avg Duration Trend</p>
                        <LineChart data={trendData} />
                    </div>

                    {/* Past Entries */}
                    {entries.length > 0 && (
                        <div style={{ marginTop: "14px", width: "100%" }}>
                            <p className="login-label" style={{ fontSize: "0.95rem", marginBottom: "10px" }}>Recent Entries</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
                                {entries.map((entry, i) => {
                                    const intensityObj = intensityOptions.find(o => o.label === entry.intensity);
                                    return (
                                        <div key={i} className="home-card" style={{ padding: "12px", alignItems: "flex-start", gap: "6px" }}>
                                            <p className="profile-label">
                                                {entry.date ? new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
                                            </p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                {entry.types && entry.types.map(t => {
                                                    const found = workoutTypes.find(w => w.label === t.name);
                                                    return (
                                                        <span key={t.name} className="text-color" style={{ background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                                                            {found ? found.emoji : ""} {t.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-color" style={{ margin: 0, fontSize: "0.82rem" }}>
                                                ⏱️ {entry.duration} mins · {intensityObj ? intensityObj.emoji : ""} {entry.intensity}
                                            </p>
                                            {entry.notes && (
                                                <p className="text-color" style={{ margin: 0, fontSize: "0.78rem", fontStyle: "italic" }}>{entry.notes}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WorkoutJournal;
