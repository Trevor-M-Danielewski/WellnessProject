import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./Api";

function Profile({setTheme, theme}) {
    const navigate = useNavigate();

    const userId = localStorage.getItem("userId");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [editing, setEditing] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    const [saved, setSaved] = useState(false);
    const [stats, setStats] = useState({ journal: 0, sleep: 0, workout: 0, growth: 0 });
    const fileInputRef = useRef(null);

    // Load user profile and stats on mount
    useEffect(() => {
        if (userId) {
            api.get(`/user/${userId}`)
            .then(res => {
                setName(res.data.name || "");
                setEmail(res.data.email || "");
                setTempName(res.data.name || "");
                setTempEmail(res.data.email || "");
            })
            .catch(err => console.log(err));

            api.get(`/stats/${userId}`)
            .then(res => setStats(res.data))
            .catch(err => console.log(err));
        }
    }, [userId]);

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onloadend = function() {
            setProfilePic(reader.result);
        };
        reader.readAsDataURL(file);
    }

    function handleSave() {
        api.put(`/user/${userId}`, { name: tempName, email: tempEmail })
        .then(res => {
            setName(res.data.name);
            setEmail(res.data.email);
            setEditing(false);
            setSaved(true);
            setTimeout(function() { setSaved(false); }, 3000);
        })
        .catch(err => console.log(err));
    }

    function handleCancel() {
        setTempName(name);
        setTempEmail(email);
        setEditing(false);
    }

    function handleEditClick() {
        setTempName(name);
        setTempEmail(email);
        setEditing(true);
    }

    //handles the embedded theme switching
    function handleThemeChange(e) {
        setTheme(e.target.value);
    }

    return (
        <div className="home-container" style={{display: "flex", flexDirection: "column", gap: "24px", padding: "40px 20px"}}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                alignItems: "stretch"
            }}>
                <div className="home-card" style={{ gap: "24px", justifyContent: "flex-start", height: "80%", marginTop: "50px" }}>
                    <button className="back-btn" onClick={() => navigate("/home")}>← Back</button>
                    <h1 className="home-title" style={{ fontSize: "2.5rem", marginBottom: 0 }}>My Profile</h1>

                    {/* Profile Picture */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                width: "110px",
                                height: "110px",
                                borderRadius: "50%",
                                background: profilePic ? "transparent" : "rgba(255,255,255,0.2)",
                                border: "3px solid rgba(255,255,255,0.5)",
                                display: "flex",
                                   alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                overflow: "hidden",
                                transition: "all 0.2s",
                            }}
                        >
                            {profilePic
                                ? <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: "2.5rem" }}>👤</span>
                            }
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                        <p className="profile-label">
                            Click to change photo
                        </p>
                    </div>

                    {/* Name & Email */}
                    <div style={{ width: "100%" }}>
                        {editing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                    <p className="login-label">Name</p>
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="login-input"
                                    />
                                </div>
                                <div>
                                    <p className="login-label">Email</p>
                                    <input
                                        type="email"
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        className="login-input"
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button className="login-btn" onClick={handleSave}>
                                        Save Changes
                                    </button>
                                    <button
                                        className="login-btn"
                                        onClick={handleCancel}
                                        style={{ background: "rgba(255,255,255,0.2)" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: "16px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                            }}>
                                <div>
                                    <p className="profile-label">Name: </p>
                                    <p className="journal-entry">{name}</p>
                                </div>
                                <div>
                                    <p className="profile-label">Email:</p>
                                    <p className="journal-entry">{email}</p>
                                </div>
                                <button className="login-btn" onClick={handleEditClick} style={{ marginTop: "8px" }}>
                                    ✏️ Edit Profile
                                </button>
                                {/*Theme switching occurs here, users select option from drop down which is then passed to App.jsx*/}
                                <select className="theme-switcher" style={{ marginTop: "8px" }} onChange={handleThemeChange} value={theme}>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="forest">Forest</option>
                                    <option value="sky">Sky</option>
                                </select>
                            </div>
                        )}
                        {saved && (
                            <p className="profile-update">✅ Profile saved!</p>
                        )}
                    </div>
                </div>
                <div className="home-card" style={{height: "80%", gap: "24px", justifyContent: "center", alignItems: "center", marginTop: "50px"}}>
                    {/* Stats Summary */}
                    <div style={{ width: "100%" }}>
                        <p className="login-label">My Stats</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                                { label: "Journal Entries", emoji: "📓", count: stats.journal },
                                { label: "Sleep Entries", emoji: "😴", count: stats.sleep },
                                { label: "Workout Entries", emoji: "💪", count: stats.workout },
                                { label: "Growth Entries", emoji: "🌱", count: stats.growth },
                            ].map(function(stat) {
                                return (
                                    <div key={stat.label} style={{
                                        background: "rgba(255,255,255,0.15)",
                                        borderRadius: "14px",
                                        padding: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}>
                                        <span style={{ fontSize: "1.8rem" }}>{stat.emoji}</span>
                                        <span className="journal-entry" style={{ fontSize: "1.5rem" }}>{stat.count}</span>
                                        <span className="nav-card-desc" >{stat.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;