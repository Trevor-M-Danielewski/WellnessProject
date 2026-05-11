import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
// test for pushing issue
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

function WorkoutJournal() {
    const navigate = useNavigate();

    const [selectedTypes, setSelectedTypes] = useState([]);
    const [duration, setDuration] = useState("");
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

    function toggleType(typeLabel) {
        if (selectedTypes.includes(typeLabel)) {
            setSelectedTypes(selectedTypes.filter(function(t) { return t !== typeLabel; }));
        } else {
            setSelectedTypes([...selectedTypes, typeLabel]);
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
            setIntensity(null);
            setNotes("");
            setSubmitted(true);
            setTimeout(function() { setSubmitted(false); }, 3000);
        })
        .catch(err => console.log(err))
    }

    return (
        <div className="home-container">
            <div className="home-card" style={{ width: "min(600px, 90vw)", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <button className="back-btn" onClick={() => navigate("/home")}>← Back</button>
                    <button className="back-btn" onClick={() => navigate("/workout/calendar")}>📅 Calendar</button>
                </div>
                <h1 className="home-title" style={{ fontSize: "2.5rem", marginBottom: 0 }}>Workout Journal</h1>
                <p className="home-subtitle" style={{ marginBottom: 0 }}>Log your workout!</p>

                {/* Workout Type */}
                <div style={{ width: "100%" }}>
                    <p className="login-label">Workout Type</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                        {workoutTypes.map(function(type) {
                            return (
                                <div
                                    key={type.label}
                                    onClick={() => toggleType(type.label)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "10px 14px",
                                        borderRadius: "14px",
                                        background: selectedTypes.includes(type.label) ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        border: selectedTypes.includes(type.label) ? "2px solid white" : "2px solid transparent",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <span style={{ fontSize: "1.8rem" }}>{type.emoji}</span>
                                    <span className="journal-label">{type.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Duration */}
                <div style={{ width: "100%" }}>
                    <p className="login-label">Duration (minutes)</p>
                    <input
                        type="number"
                        min="1"
                        placeholder="e.g. 45"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="login-input"
                        style={{ width: "auto" }}
                    />
                </div>

                {/* Intensity */}
                <div style={{ width: "100%" }}>
                    <p className="login-label">Intensity</p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                        {intensityOptions.map(function(option) {
                            return (
                                <div
                                    key={option.label}
                                    onClick={() => setIntensity(option)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "10px 14px",
                                        borderRadius: "14px",
                                        background: intensity?.label === option.label ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        border: intensity?.label === option.label ? "2px solid white" : "2px solid transparent",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <span style={{ fontSize: "1.8rem" }}>{option.emoji}</span>
                                    <span className="journal-label">{option.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notes */}
                <div style={{ width: "100%" }}>
                    <p className="login-label">Notes</p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How did it go? Any PRs, struggles, or highlights..."
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

            {/* Past Entries */}
            {entries.length > 0 && (
                <div style={{ width: "min(600px, 90vw)", marginTop: "40px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <h2 className="text-color" style={{ fontFamily: "arial, sans-serif", textAlign: "center" }}>Past Entries</h2>
                    {entries.map(function(entry, i) {
                        const intensityObj = intensityOptions.find(o => o.label === entry.intensity);
                        return (
                            <div key={i} className="home-card" style={{ alignItems: "flex-start", gap: "12px" }}>
                                <p className="profile-label">
                                    {entry.date ? new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {entry.types && entry.types.map(function(t) {
                                        const found = workoutTypes.find(w => w.label === t.name);
                                        return (
                                            <span key={t.name} className="text-color" style={{
                                                background: "rgba(255,255,255,0.2)",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: 700,
                                            }}>
                                                {found ? found.emoji : ""} {t.name}
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-color" style={{ margin: 0, fontSize: "0.9rem" }}>
                                    ⏱️ {entry.duration} mins &nbsp;|&nbsp; {intensityObj ? intensityObj.emoji : ""} {entry.intensity}
                                </p>
                                {entry.notes && (
                                    <p className="text-color" style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{entry.notes}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default WorkoutJournal;