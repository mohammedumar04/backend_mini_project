import { Link,useNavigate } from 'react-router-dom'
import {useForm} from 'react-hook-form'
import ThemeToggle from '../components/ThemeToggle'
import { useState } from 'react'
import axios from 'axios'

const Login = () => {

  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  const {register,handleSubmit,reset} = useForm();
  
      const submitHandler = async (data)=>{
        setErrorMessage('')
        try {
          await axios.post("/api/auth/login",{
              email: data.email,
              password: data.password
          }, {
            withCredentials: true
          })
          navigate("/")
          reset()
        } catch (error) {
          setErrorMessage(error.response?.data?.message || 'Unable to log in. Please try again.')
        }
      }

  return (
    <main className="auth-shell">
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="Mosaic home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>Mosaic</span>
        </Link>
        <div className="auth-header-actions">
          <span className="auth-header-note">Your thinking space</span>
          <ThemeToggle />
        </div>
      </header>
      <section className="auth-grid">
        <div className="auth-story">
          <p className="eyebrow">Welcome back</p>
          <h1>Pick up where your curiosity left off.</h1>
          <p className="auth-description">Sign in to return to your conversations and keep exploring.</p>
        </div>
        <div className="auth-form-panel">
          <h2>Sign in</h2>
          <p className="form-intro">Enter your account details to continue.</p>
          <form className="auth-form" onSubmit={handleSubmit(submitHandler)}>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" autoComplete="email" {...register("email",{required:"email not be empty"})} type="email" placeholder="you@example.com" />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" autoComplete="current-password" {...register("password",{required:"password not be empty"})} type="password" placeholder="Enter your password" />
            </div>
            {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
            <button className="button-primary" type="submit">Login</button>
          </form>
          <p className="form-switch">
            Don&apos;t have an account? <Link className="text-link" to="/register">Register</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
