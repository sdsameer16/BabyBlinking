import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <Link to="/login">
        <button className="login-btn">Login/Register</button>
      </Link>
      <h1>
        <span>B</span>
        <span>A</span>
        <span>B</span>
        <span>Y</span>
        <span> </span>
        <span>B</span>
        <span>L</span>
        <span>I</span>
        <span>N</span>
        <span>K</span>
      </h1>
    </div>
  );
}
