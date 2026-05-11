import React, { useState } from "react";
import api from "./Api";
import { useNavigate, Link } from "react-router-dom";
import DayByDayLogo from "./assets/DayByDay.svg";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await api.post("/signup", { name, email, password });

            if (result.data.status === "Success") {
                localStorage.setItem("token", result.data.token);
                localStorage.setItem("userId", result.data.userId);
                localStorage.setItem("userName", result.data.name);
                navigate("/home");
            } else {
                setError("Signup failed. Please review your information.");
            }
        } catch (err) {
            setError("Could not connect to the server. Make sure it is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-container">
            <div className="flex-child">
                <img src={DayByDayLogo} alt="Day By Day Lettering" className="logo-img" />
            </div>
            <div className="flex-child" id="divTrans">
                <h2 className="login-title">Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <label className="login-label">Name:</label>
                    <input
                        type="text"
                        placeholder="Enter Name"
                        autoComplete="off"
                        className="login-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <label className="login-label">Email:</label>
                    <input
                        type="email"
                        placeholder="Enter Email"
                        autoComplete="off"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label className="login-label">Password:</label>
                    <input
                        type="password"
                        placeholder="Enter Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Already have an account? <Link to="/login" className="login-link">Login</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Signup;