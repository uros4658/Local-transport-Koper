import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "./firebase";
import './Login.css'; // Add this import to use the external CSS file

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  async function emailLogin() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const token = await auth.currentUser.getIdToken(true);
      if (token) {
        localStorage.setItem("@token", token);
        navigate("/search");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function emailRegister() {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const token = await auth.currentUser.getIdToken(true);
      if (token) {
        localStorage.setItem("@token", token);
        navigate("/search");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await auth.currentUser.getIdToken(true);
      if (token) {
        localStorage.setItem("@token", token);
        navigate("/search");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="background">
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>
      <form className="form-container">
        <h3>{isRegistering ? "Register Here" : "Login Here"}</h3>

        <label htmlFor="email">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" id="email" />

        <label htmlFor="password">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" id="password" />

        <button type="button" onClick={isRegistering ? emailRegister : emailLogin}>
          {isRegistering ? "Register" : "Log In"}
        </button>

        <div className="toggle" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
        </div>

        <div className="social">
          <div className="social-button google" onClick={googleLogin}>
            <i className="fab fa-google"></i> Google
          </div>
          <div className="social-button facebook">
            <i className="fab fa-facebook"></i> Facebook
          </div>
        </div>
      </form>
    </div>
  );
}
