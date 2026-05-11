import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
// test for pushing issue
const defaultHabits = [
    "Exercise", "Read", "Meditate", "Drink Water",
    "Sleep 8hrs", "Eat Healthy", "Journal", "Study"
];

const progressOptions = [
    { label: "Not Started", emoji: "😶" },
    { label: "Just Beginning", emoji: "🌱" },
    { label: "Making Progress", emoji: "📈" },
    { label: "Almost There", emoji: "🔥" },
    { label: "Crushed It", emoji: "🏆" },
];


function GoalLineChart({ data }) {
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
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-color)" fontSize="9" fontWeight="bold">{data[i].avg}</text>
                        <text x={p.x} y={h - 1} textAnchor="middle" fill="var(--text-color)" fontSize="9" opacity="0.6">{data[i].month}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function PersonalGrowth() {
    const navigate = useNavigate();

    const [goalInput, setGoalInput] = useState("");
    const [goals, setGoals] = useState([]);
    const [checkedHabits, setCheckedHabits] = useState([]);
    const [progress, setProgress] = useState(null);
    const [motivationalNote, setMotivationalNote] = useState("");
    const [entries, setEntries] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (userId) {
            api.get(`/growth/${userId}`)
                .then(res => setEntries(res.data))
                .catch(err => console.log(err));
        }
    }, [userId]);

    const weeklyHabitsData = (() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            const label = d.toLocaleDateString("en-US", { weekday: "short" });
            const entry = entries.find(e => new Date(e.date).toDateString() === d.toDateString());
            return { day: label, count: entry ? (entry.habits?.length || 0) : 0 };
        });
    })();

    const habitBreakdownData = (() => {
        if (entries.length === 0) return [];
        const counts = {};
        entries.forEach(e => (e.habits || []).forEach(h => { counts[h.name] = (counts[h.name] || 0) + 1; }));
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, pct: Math.round((count / entries.length) * 100), emoji: "✅" }));
    })();

    const goalTrendData = (() => {
        if (entries.length === 0) return [{ month: "—", avg: 0 }];
        const monthMap = {};
        entries.forEach(e => {
            const d = new Date(e.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const label = d.toLocaleDateString("en-US", { month: "short" });
            if (!monthMap[key]) monthMap[key] = { month: label, avg: 0, sort: d.getFullYear() * 12 + d.getMonth() };
            monthMap[key].avg += (e.goals || []).filter(g => g.done).length;
        });
        return Object.values(monthMap).sort((a, b) => a.sort - b.sort).slice(-4);
    })();

    const now = new Date();
    const goalsThisMonth = entries
        .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
        .reduce((sum, e) => sum + (e.goals || []).filter(g => g.done).length, 0);

    const todayEntry = entries.find(e => new Date(e.date).toDateString() === now.toDateString());
    const habitsToday = todayEntry ? (todayEntry.habits?.length || 0) : 0;

    function addGoal() {
        if (!goalInput.trim()) return;
        setGoals([...goals, { text: goalInput.trim(), done: false }]);
        setGoalInput("");
    }

    function toggleGoal(index) {
        setGoals(goals.map((g, i) => i === index ? { ...g, done: !g.done } : g));
    }

    function removeGoal(index) {
        setGoals(goals.filter((_, i) => i !== index));
    }

    function toggleHabit(habit) {
        if (checkedHabits.includes(habit)) {
            setCheckedHabits(checkedHabits.filter(h => h !== habit));
        } else {
            setCheckedHabits([...checkedHabits, habit]);
        }
    }

    function handleSubmit() {
        if (goals.length === 0) { alert("Please add at least one goal!"); return; }
        if (!progress) { alert("Please select a progress rating!"); return; }

        const newEntry = {
            userId,
            goals: goals.map(g => ({ goalText: g.text, done: g.done })),
            habits: checkedHabits.map(h => ({ name: h })),
            progress: progress.label,
            motivationalNote,
        };

        api.post("/growth", newEntry)
            .then(() => api.get(`/growth/${userId}`))
            .then(res => {
                setEntries(res.data);
                setGoals([]);
                setCheckedHabits([]);
                setProgress(null);
                setMotivationalNote("");
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 3000);
            })
            .catch(err => console.log(err));
    }

    return (
        <div className="home-container" style={{ alignItems: "stretch", justifyContent: "flex-start", padding: "16px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <button className="back-btn" onClick={() => navigate("/home")}>← Back</button>
                <h1 className="home-title" style={{ fontSize: "1.8rem", margin: 0 }}>🌱 Personal Growth</h1>
                <div style={{ width: "80px" }} />
            </div>

            {/* Main 2-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "14px", alignItems: "start" }}>

                {/* LEFT — Log form */}
                <div className="home-card" style={{ padding: "18px", gap: "12px", alignItems: "stretch" }}>
                    <p className="login-label" style={{ fontSize: "0.95rem", margin: 0 }}>Log Today's Growth</p>

                    {/* Goals */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Your Goals</p>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                placeholder="Add a goal..."
                                value={goalInput}
                                onChange={(e) => setGoalInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }}
                                className="login-input"
                                style={{ marginBottom: 0, flex: 1 }}
                            />
                            <button className="login-btn" onClick={addGoal} style={{ width: "auto", padding: "8px 16px", marginTop: 0 }}>
                                Add
                            </button>
                        </div>
                        {goals.length > 0 && (
                            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {goals.map((goal, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "rgba(255,255,255,0.15)",
                                        borderRadius: "10px",
                                        padding: "8px 12px",
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={goal.done}
                                            onChange={() => toggleGoal(i)}
                                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                        />
                                        <span className="text-color" style={{
                                            flex: 1,
                                            fontWeight: 700,
                                            fontSize: "0.85rem",
                                            textDecoration: goal.done ? "line-through" : "none",
                                            opacity: goal.done ? 0.6 : 1,
                                        }}>
                                            {goal.text}
                                        </span>
                                        <span onClick={() => removeGoal(i)} style={{ cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>✕</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Daily Habits */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Daily Habits</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {defaultHabits.map(habit => (
                                <div
                                    key={habit}
                                    onClick={() => toggleHabit(habit)}
                                    className="text-color"
                                    style={{
                                        cursor: "pointer",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        background: checkedHabits.includes(habit) ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        border: checkedHabits.includes(habit) ? "2px solid white" : "2px solid transparent",
                                        fontWeight: 700,
                                        fontSize: "0.78rem",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {checkedHabits.includes(habit) ? "✅ " : ""}{habit}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Rating */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Overall Progress</p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                            {progressOptions.map(option => (
                                <div
                                    key={option.label}
                                    onClick={() => setProgress(option)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "8px 10px",
                                        borderRadius: "12px",
                                        background: progress?.label === option.label ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        border: progress?.label === option.label ? "2px solid white" : "2px solid transparent",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "3px",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <span style={{ fontSize: "1.4rem" }}>{option.emoji}</span>
                                    <span className="text-color" style={{ fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>{option.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Motivational Note */}
                    <div>
                        <p className="login-label" style={{ fontSize: "0.8rem", marginBottom: "6px" }}>Motivational Note</p>
                        <textarea
                            value={motivationalNote}
                            onChange={(e) => setMotivationalNote(e.target.value)}
                            placeholder="Write something to motivate yourself..."
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
                            { label: "Entries", value: `${entries.length}`, sub: "total logged", icon: "🔥" },
                            { label: "Goals Done", value: `${goalsThisMonth}`, sub: "this month", icon: "✅" },
                            { label: "Habits", value: `${habitsToday}/${defaultHabits.length}`, sub: "today", icon: "🌱" },
                        ].map(s => (
                            <div key={s.label} className="home-card" style={{ padding: "12px 8px", gap: "4px" }}>
                                <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
                                <div className="login-label" style={{ fontSize: "1rem", margin: 0 }}>{s.value}</div>
                                <div className="text-color" style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.6 }}>{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Weekly habits bar chart */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📅 Weekly Habits</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                            {weeklyHabitsData.map(function(d) {
                                const maxBar = Math.max(...weeklyHabitsData.map(x => x.count), 1);
                                const barH = d.count > 0 ? Math.max((d.count / maxBar) * 60, 10) : 4;
                                return (
                                    <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "4px", height: "100%" }}>
                                        <span className="text-color" style={{ fontSize: "0.58rem", fontWeight: 700, height: "12px", opacity: 0.7 }}>
                                            {d.count > 0 ? d.count : ""}
                                        </span>
                                        <div style={{
                                            width: "100%",
                                            height: barH + "px",
                                            background: d.count > 0 ? "var(--button-bg)" : "rgba(0,0,0,0.1)",
                                            borderRadius: "5px 5px 2px 2px",
                                            opacity: d.count > 0 ? 1 : 0.4,
                                        }} />
                                        <span className="text-color" style={{ fontSize: "0.6rem", fontWeight: 700 }}>{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Habit consistency breakdown */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "8px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>🏆 Habit Consistency</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                            {habitBreakdownData.map(function(h) {
                                return (
                                    <div key={h.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "20px", textAlign: "center", fontSize: "0.9rem" }}>{h.emoji}</span>
                                        <div style={{ flex: 1, height: "9px", background: "rgba(0,0,0,0.1)", borderRadius: "5px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: h.pct + "%", background: "var(--button-bg)", borderRadius: "5px", opacity: 0.6 + h.pct / 100 }} />
                                        </div>
                                        <span className="text-color" style={{ fontSize: "0.72rem", fontWeight: 700, width: "28px", textAlign: "right" }}>{h.pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Goals completed trend */}
                    <div className="home-card" style={{ padding: "14px 16px", alignItems: "stretch", gap: "6px" }}>
                        <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📈 Goals Completed Trend</p>
                        <GoalLineChart data={goalTrendData} />
                    </div>

                    {/* Past entries */}
                    {entries.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <p className="login-label" style={{ fontSize: "0.9rem", margin: 0 }}>📖 Past Entries</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                                {entries.map((entry, i) => {
                                    const progressObj = progressOptions.find(p => p.label === entry.progress);
                                    return (
                                        <div key={i} className="home-card" style={{ padding: "12px", alignItems: "flex-start", gap: "6px" }}>
                                            <p className="profile-label">
                                                {entry.date ? new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
                                            </p>
                                            <p className="text-color" style={{ fontWeight: 800, fontSize: "0.9rem", margin: 0 }}>
                                                {progressObj ? progressObj.emoji : ""} {entry.progress}
                                            </p>
                                            {entry.goals && entry.goals.length > 0 && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    {entry.goals.map((g, j) => (
                                                        <p key={j} className="text-color" style={{ margin: 0, fontSize: "0.78rem" }}>
                                                            {g.done ? "✅" : "⬜"} {g.goalText}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {entry.habits && entry.habits.length > 0 && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                    {entry.habits.map(h => (
                                                        <span key={h.name} className="text-color" style={{
                                                            background: "rgba(255,255,255,0.2)",
                                                            padding: "3px 8px",
                                                            borderRadius: "20px",
                                                            fontSize: "0.72rem",
                                                            fontWeight: 700,
                                                        }}>
                                                            ✅ {h.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {entry.motivationalNote && (
                                                <p className="text-color" style={{ margin: 0, fontSize: "0.78rem", fontStyle: "italic" }}>"{entry.motivationalNote}"</p>
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

export default PersonalGrowth;