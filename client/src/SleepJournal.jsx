import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
// test for pushing issue
const qualityOptions = [
    { label: "Terrible", emoji: "😵" },
    { label: "Poor", emoji: "😞" },
    { label: "Okay", emoji: "😐" },
    { label: "Good", emoji: "😊" },
    { label: "Great", emoji: "🌟" },
];

const restfulOptions = [
    { label: "Exhausted", emoji: "😵" },
    { label: "Sleepy", emoji: "😞" },
    { label: "Rested", emoji: "😊" },
    { label: "Well Rested", emoji: "🌟" },
];

function parseDurationHours(duration) {
    if (!duration) return 0;
    const h = duration.match(/(\d+)h/);
    const m = duration.match(/(\d+)m/);
    return (h ? parseInt(h[1]) : 0) + (m ? parseInt(m[1]) / 60 : 0);
}

function LineChart({ data }) {
    const maxVal = Math.max(...data.map(d => d.avg), 1);
    const w = 260;
    const h = 90;
    const padX = 16;
    const padY = 16;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2 - 14;

    const pts = data.map(function(d, i) {
        const xMultiplier = data.length > 1 ? (i / (data.length - 1)) : 0.5;

        return {
            x: padX + xMultiplier * plotW,
            y: padY + plotH - (d.avg / maxVal) * plotH,
        };
    });

    const path = pts.map(function(p, i) {
        return (i === 0 ? "M" : "L") + " " + p.x + " " + p.y;
    }).join(" ");

    return (
        <svg viewBox={"0 0 " + w + " " + h} style={{ width: "100%" }}>
            <path d={path} fill="none" stroke="var(--button-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(function(p, i) {
                return (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="var(--button-bg)" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-color)" fontSize="9" fontWeight="bold">{data[i].avg}h</text>
                        <text x={p.x} y={h - 1} textAnchor="middle" fill="var(--text-color)" fontSize="9" opacity="0.6">{data[i].month}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function calculateDuration(bedtime, waketime) {
    if (!bedtime || !waketime) {
        return null;
    }

    const bedParts = bedtime.split(":");
    const wakeParts = waketime.split(":");

    const bedHours = Number(bedParts[0]);
    const bedMinutes = Number(bedParts[1]);
    const wakeHours = Number(wakeParts[0]);
    const wakeMinutes = Number(wakeParts[1]);

    let bedTotal = bedHours * 60 + bedMinutes;
    let wakeTotal = wakeHours * 60 + wakeMinutes;

    if (wakeTotal <= bedTotal) {
        wakeTotal = wakeTotal + 24 * 60;
    }

    const diff = wakeTotal - bedTotal;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return hours + "h " + minutes + "m";
}

function SleepJournal() {
    const navigate = useNavigate();

    const [bedtime, setBedtime] = useState("");
    const [waketime, setWaketime] = useState("");
    const [quality, setQuality] = useState(null);
    const [restfulness, setRestfulness] = useState(2);
    const [notes, setNotes] = useState("");
    const [entries, setEntries] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const userId = localStorage.getItem("userId");
    const duration = calculateDuration(bedtime, waketime);

    const weeklyData = (() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            const label = d.toLocaleDateString("en-US", { weekday: "short" });
            const entry = entries.find(e => new Date(e.date).toDateString() === d.toDateString());
            return { day: label, duration: entry ? Math.round(parseDurationHours(entry.duration) * 10) / 10 : 0 };
        });
    })();

    const typeData = (() => {
        if (entries.length === 0) return [];
        const counts = {};
        qualityOptions.forEach(q => { counts[q.label] = 0; });
        entries.forEach(e => { if (e.quality && counts[e.quality] !== undefined) counts[e.quality]++; });
        return qualityOptions
            .map(q => ({ name: q.label, emoji: q.emoji, pct: Math.round((counts[q.label] / entries.length) * 100) }))
            .filter(q => q.pct > 0);
    })();

    const trendData = (() => {
        if (entries.length === 0) return [{ month: "—", avg: 0 }];
        const monthMap = {};
        entries.forEach(e => {
            const d = new Date(e.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const label = d.toLocaleDateString("en-US", { month: "short" });
            if (!monthMap[key]) monthMap[key] = { month: label, total: 0, count: 0, sort: d.getFullYear() * 12 + d.getMonth() };
            monthMap[key].total += parseDurationHours(e.duration);
            monthMap[key].count++;
        });
        return Object.values(monthMap)
            .sort((a, b) => a.sort - b.sort)
            .slice(-4)
            .map(m => ({ month: m.month, avg: Math.round((m.total / m.count) * 10) / 10 }));
    })();

    const nightsThisWeek = weeklyData.filter(d => d.duration > 0).length;

    const allHours = entries.map(e => parseDurationHours(e.duration)).filter(h => h > 0);
    const avgDuration = allHours.length > 0
        ? (allHours.reduce((a, b) => a + b, 0) / allHours.length).toFixed(1) + " hr"
        : "—";

    const bestEntry = entries.reduce((best, e) => {
        return parseDurationHours(e.duration) > parseDurationHours(best?.duration || "") ? e : best;
    }, null);
    const bestDuration = bestEntry ? parseDurationHours(bestEntry.duration).toFixed(1) + " hr" : "—";
    const bestDay = bestEntry ? new Date(bestEntry.date).toLocaleDateString("en-US", { weekday: "long" }) : "—";

    useEffect(() => {
        if (userId) {
            api.get(`/sleep/${userId}`)
            .then(res => setEntries(res.data))
            .catch(err => console.log(err))
        }
    }, [userId]);

    function handleSubmit() {
        if (!bedtime || !waketime) {
            alert("Please enter both bedtime and wake time!");
            return;
        }
        if (!quality) {
            alert("Please select a sleep quality!");
            return;
        }

        const newEntry = {
            userId: userId,
            bedtime: bedtime,
            waketime: waketime,
            duration: duration,
            quality: quality?.label,
            restfulness: restfulness,
            notes: notes,
        };

        api.post("/sleep", newEntry)
        .then(() => api.get(`/sleep/${userId}`))
        .then(res => {
            setEntries(res.data);
            setBedtime("");
            setWaketime("");
            setQuality(null);
            setNotes("");
            setSubmitted(true);
            setTimeout(function() { setSubmitted(false); }, 3000);
        })
        .catch(err => console.log(err))
    }

    return (
        <div className="home-container" style={{ padding: "40px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>

                {/* LEFT — Input Form */}
                <div className="home-card" style={{ gap: "24px", justifyContent: "flex-start" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <button className="back-btn" onClick={() => navigate("/home")}>← Back</button>
                        <button className="back-btn" onClick={() => navigate("/sleep/calendar")}>📅 Calendar</button>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <h1 className="home-title" style={{ fontSize: "2.2rem", marginBottom: "4px" }}>Sleep Journal</h1>
                        <p className="home-subtitle" style={{ marginBottom: 0 }}>How did you sleep?</p>
                    </div>

                    {/* Bedtime & Wake Time */}
                    <div style={{ width: "100%", display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <p className="login-label">Bedtime</p>
                            <input
                                type="time"
                                value={bedtime}
                                onChange={(e) => setBedtime(e.target.value)}
                                className="login-input"
                                style={{ width: "auto" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p className="login-label">Wake Time</p>
                            <input
                                type="time"
                                value={waketime}
                                onChange={(e) => setWaketime(e.target.value)}
                                className="login-input"
                                style={{ width: "auto" }}
                            />
                        </div>
                    </div>

                    {/* Auto-calculated Duration */}
                    {duration && (
                        <div style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: "14px",
                            padding: "14px 20px",
                            textAlign: "center",
                        }}>
                            <p className="journal-entry">
                                😴 Total Sleep: {duration}
                            </p>
                        </div>
                    )}

                    {/* Sleep Quality */}
                    <div style={{ width: "100%" }}>
                        <p className="login-label">Sleep Quality</p>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                            {qualityOptions.map(function(q) {
                                return (
                                    <div
                                        key={q.label}
                                        onClick={() => setQuality(q)}
                                        className="text-color"
                                        style={{
                                            cursor: "pointer",
                                            padding: "10px 14px",
                                            borderRadius: "14px",
                                            background: quality?.label === q.label ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                            border: quality?.label === q.label ? "2px solid white" : "2px solid transparent",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "4px",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <span style={{ fontSize: "1.8rem" }}>{q.emoji}</span>
                                        <span className="journal-label">{q.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Restful */}
                    <div style={{ width: "100%" }}>
                        <p className="login-label">Restfulness</p>

                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "1.8rem" }}>
                                {restfulOptions[restfulness].emoji}
                            </span>
                            <span
                                className="journal-label"
                                style={{ marginLeft: "8px" }}
                            >
                                {restfulOptions[restfulness].label}
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="journal-label">
                                {restfulOptions[0].label}
                            </span>

                            <input
                                type="range"
                                min={0}
                                max={restfulOptions.length - 1}
                                step={1}
                                value={restfulness}
                                onChange={(e) => setRestfulness(Number(e.target.value))}
                                style={{ width: "100%" }}
                            />

                            <span className="journal-label">
                                {restfulOptions[restfulOptions.length - 1].label}
                            </span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{width: "100%"}}>
                        <p className="login-label">Notes</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any thoughts before bed, dreams, or things that affected your sleep..."
                            rows={4}
                            className="text-color"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "12px",
                                border: "none",
                                background: "rgba(255,255,255,0.2)",
                                fontSize: "0.95rem",
                                fontFamily: "arial, sans-serif",
                                resize: "vertical",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <button className="login-btn" onClick={handleSubmit}>
                        Save Entry
                    </button>
                    {submitted && (
                        <p className="text-color" style={{ fontWeight: 700 }}>✅ Entry saved!</p>
                    )}
                </div>

                {/* RIGHT — Stats & Charts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                     {/* Quick stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {[
                            { label: "This Week", value: `${nightsThisWeek}`, sub: "nights", icon: "🌙" },
                            { label: "Avg Duration", value: avgDuration, sub: "per night", icon: "⏳" },
                            { label: "Best Sleep", value: bestDuration, sub: bestDay, icon: "🌟" },
                        ].map(function(s) {
                            return (
                                <div key={s.label} className="home-card" style={{ padding: "12px 8px", gap: "4px" }}>
                                    <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
                                    <div className="login-label" style={{ fontSize: "1rem", margin: 0 }}>{s.value}</div>
                                    <div className="text-color" style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.6 }}>{s.sub}</div>
                                </div>
                            );
                        })}
                    </div>

                     {/* Weekly activity bar chart */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📅 Weekly Sleep</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                            {weeklyData.map(function(d) {
                                const maxBar = Math.max(...weeklyData.map(x => x.duration), 1);
                                const barH = d.duration > 0 ? Math.max((d.duration / maxBar) * 60, 10) : 4;
                                return (
                                    <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "4px", height: "100%" }}>
                                        <span className="text-color" style={{ fontSize: "0.58rem", fontWeight: 700, height: "12px", opacity: 0.7 }}>
                                            {d.duration > 0 ? d.duration + "h" : ""}
                                        </span>
                                        <div style={{
                                            width: "100%",
                                            height: barH + "px",
                                            background: d.duration > 0 ? "var(--button-bg)" : "rgba(0,0,0,0.1)",
                                            borderRadius: "5px 5px 2px 2px",
                                            opacity: d.duration > 0 ? 1 : 0.4,
                                        }} />
                                        <span className="text-color" style={{ fontSize: "0.6rem", fontWeight: 700 }}>{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                     {/* Sleep quality breakdown */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>🏆 Weekly Quality Breakdown</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                            {typeData.map(function(t) {
                                return (
                                    <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "20px", textAlign: "center", fontSize: "0.9rem" }}>{t.emoji}</span>
                                        <div style={{ flex: 1, height: "9px", background: "rgba(0,0,0,0.1)", borderRadius: "5px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: t.pct + "%", background: "var(--button-bg)", borderRadius: "5px", opacity: 0.6 + t.pct / 100 }} />
                                        </div>
                                        <span className="text-color" style={{ fontSize: "0.72rem", fontWeight: 700, width: "28px", textAlign: "right" }}>{t.pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                     {/* Duration trend line chart */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "6px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📈 Average Hours of Sleep per Night</p>
                        <LineChart data={trendData} />
                    </div>
                </div>
            </div>

            {/* Past entries grid */}
            {entries.length > 0 && (
                <div style={{ marginTop: "14px", width: "100%", maxWidth: "1200px", margin: "14px auto 0 auto" }}>
                    <p className="login-label" style={{ fontSize: "0.95rem", marginBottom: "10px" }}>Recent Entries</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
                        {entries.map(function(entry, i) {
                            const qualityObj = qualityOptions.find(q => q.label === entry.quality);
                            return (
                                <div key={i} className="home-card" style={{ padding: "12px", alignItems: "flex-start", gap: "6px" }}>
                                    <p className="profile-label">
                                        {entry.date ? new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        <span className="text-color" style={{ background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                                            {qualityObj ? qualityObj.emoji : ""} {entry.quality} Sleep
                                        </span>
                                    </div>
                                    <p className="text-color" style={{ margin: 0, fontSize: "0.82rem" }}>
                                        🛏️ {entry.bedtime} → ⏰ {entry.waketime} &nbsp;|&nbsp; 😴 {entry.duration}
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
    );
}

export default SleepJournal;