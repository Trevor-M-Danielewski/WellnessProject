import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import SettingsIcon from "./assets/profile.svg";

// Temporary quote generator
import { getDailyQuote } from "./assets/tempQuotes.js";

// Chart generation done through use of ChartJS
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// List of accessible tabs in the main dashboard
const navItems = [
    { label: "Journal", path: "/journal", desc: "Log your thoughts & feelings" },
    { label: "Sleep", path: "/sleep", desc: "Track your sleep schedule" },
    { label: "Workout", path: "/workout", desc: "Monitor your activity" },
    { label: "Personal Growth", path: "/growth", desc: "Track your goals & habits" },
];

function Home() {
    const navigate = useNavigate();

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    // State monitors whether Settings are being accessed
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [quickNote, setQuickNote] = useState("");

    // Graph data state — starts empty, filled from DB
    const [moodData, setMoodData] = useState({ labels: [], values: [] });
    const [sleepData, setSleepData] = useState({ labels: [], values: [] });
    const [workoutData, setWorkoutData] = useState({ labels: [], values: [] });

    const moodScores = {
        "Happy": 5, "Excited": 5, "Hopeful": 5, "Grateful": 5, "Loved": 5,
        "Calm": 4, "Neutral": 3, "Confused": 3, "Tired": 2,
        "Worried": 2, "Anxious": 2, "Sad": 1, "Frustrated": 1,
        "Stressed": 1, "Angry": 1, "Overwhelmed": 1,
    };

    useEffect(() => {
        if (userId) {
            api.get(`/recent/${userId}`)
            .then(res => {
                const { journal, sleep, workout } = res.data;

                // Mood: map mood label to a score 1-5
                setMoodData({
                    labels: journal.map(e => new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })).reverse(),
                    values: journal.map(e => moodScores[e.mood] || 3).reverse(),
                });

                // Sleep: use duration hours
                setSleepData({
                    labels: sleep.map(e => new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })).reverse(),
                    values: sleep.map(e => {
                        const match = e.duration ? e.duration.match(/(\d+)h/) : null;
                        return match ? parseInt(match[1]) : 0;
                    }).reverse(),
                });

                // Workout: use duration in minutes
                setWorkoutData({
                    labels: workout.map(e => new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })).reverse(),
                    values: workout.map(e => e.duration || 0).reverse(),
                });
            })
            .catch(err => console.log(err));
        }
    }, [userId]);

    // Quote Generation
    const daily = getDailyQuote();
    function getQuote(){
        return daily.text;
    }
    function getAuthor(){
        return daily.author;
    }

    // Handling for navigation at the settings icon
    function handleLogout() {
        localStorage.clear();
        navigate("/login");
    }
    function handleProfile(){
        navigate("/profile");
    }

    // Returns current Date
    function todaysDate(){
         return new Date().toLocaleDateString();
    }

    // Chart manipulation area, changing colors for the graph
    const [chartTextColor, setChartTextColor] = useState("#333");
    const [lineColor, setLineColor] = useState("#4A90E2");

    // Pulls colors from existing CSS values
    React.useEffect(() => {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color').trim();
        if (color) {
            setChartTextColor(color);
        }
    }, []);
    React.useEffect(() => {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--line-color').trim();
        if (color) {
            setLineColor(color);
        }
    }, []);

    const graphOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                ticks: { color: chartTextColor },
                grid: {
                    color: chartTextColor,
                    borderColor: chartTextColor,
                    drawTicks: false
                }
            },
            y: {
                ticks: { color: chartTextColor, padding: 10 },
                grid: {
                    color: chartTextColor,
                    borderColor: chartTextColor,
                    drawTicks: false
                }
            }
        }
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <div className="settings-btn" onClick={() => setSettingsOpen(!settingsOpen)}>
                    <img src={SettingsIcon} alt="Settings" className="settings-icon" />
                    {settingsOpen && (
                        <div className="settings-dropdown">
                            <button className="settings-item" onClick={handleProfile}>Profile</button>
                            <button className="settings-item" onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
                <div className="nav-bar">
                    <div>
                        <h1 className="home-title">Welcome{userName ? `, ${userName}` : " to DayByDay"}</h1>
                        <p className="home-subtitle">Today is: {todaysDate()}</p>
                    </div>
                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            className="nav-card"
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-card-label">{item.label}</span>
                            <span className="nav-card-desc">{item.desc}</span>
                        </div>
                    ))}
                </div>
                <div className="nav-graph">
                    <div className="graph-nav-card">
                        <span className="nav-card-label">Mood Graph</span>
                        <div className="home-graph" style={{ height:'150px', width:"100%", minWidth: 0, overflow: "hidden" }}>
                            <Line
                                data={{
                                    labels: moodData.labels.length > 0 ? moodData.labels : ['No data yet'],
                                    datasets: [{
                                        label: "Mood",
                                        data: moodData.values.length > 0 ? moodData.values : [0],
                                        fill: false,
                                        borderColor: lineColor,
                                        tension: 0.1
                                    }]
                                }}
                                options={graphOptions}
                            />
                        </div>
                        <span className="back-btn" onClick={() => navigate("/journal")}>Need to enter your mood?</span>
                    </div>
                    <div className="graph-nav-card">
                        <span className="nav-card-label">Sleep Graph</span>
                        <div className="home-graph" style={{ height:'150px', width:"100%", minWidth: 0, overflow: "hidden" }}>
                            <Line
                                data={{
                                    labels: sleepData.labels.length > 0 ? sleepData.labels : ['No data yet'],
                                    datasets: [{
                                        label: "Sleep",
                                        data: sleepData.values.length > 0 ? sleepData.values : [0],
                                        fill: false,
                                        borderColor: lineColor,
                                        tension: 0.1
                                    }]
                                }}
                                options={graphOptions}
                            />
                        </div>
                        <span className="back-btn" onClick={() => navigate("/sleep")}>Need to enter slept hours?</span>
                    </div>
                    <div className="graph-nav-card">
                        <span className="nav-card-label">Workout Graph</span>
                        <div className="home-graph" style={{ height:'150px', width:"100%", minWidth: 0, overflow: "hidden" }}>
                            <Line
                                data={{
                                    labels: workoutData.labels.length > 0 ? workoutData.labels : ['No data yet'],
                                    datasets: [{
                                        label: "Workout",
                                        data: workoutData.values.length > 0 ? workoutData.values : [0],
                                        fill: false,
                                        borderColor: lineColor,
                                        tension: 0.1
                                    }]
                                }}
                                options={graphOptions}
                            />
                        </div>
                        <span className="back-btn" onClick={() => navigate("/workout")}>Need to enter your workout?</span>
                    </div>
                </div>
                <div className="nav-bottom-bar">
                    <div className="nav-card" style={{ gridColumn: '2 / 4' }}>
                        <span className="nav-card-label">Got something on your mind?</span>
                        <textarea
                            className="journal-text"
                            placeholder="Write about it..."
                            rows="10"
                            cols="50"
                            maxLength="400"
                            value={quickNote}
                            onChange={(e) => setQuickNote(e.target.value)}
                        ></textarea>
                        <div style={{display: "flex", flexDirection: "row", padding: "5px"}}>
                            <div className="back-btn" onClick={() => {
                                if (quickNote.trim()) {
                                    localStorage.setItem("quickNote", quickNote.trim());
                                }
                                navigate("/journal");
                            }}>Submit</div>
                        </div>
                    </div>
                    <div className="nav-card" style={{ gridColumn: '4 / 6', justifyContent: "center", }}>
                        <span id="quote" className="nav-card-desc" style={{fontSize:"2rem"}}>{getQuote()}</span>
                        <span id="author" className="nav-card-label" style={{fontSize:"2rem"}}>- {getAuthor()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;