import { Link,useNavigate } from 'react-router-dom'
import {useForm} from 'react-hook-form'
import ThemeToggle from '../components/ThemeToggle'
import { useState } from 'react'
import axios from 'axios'

const Register = () => {

    const navigate = useNavigate()
    const [errorMessage, setErrorMessage] = useState('')
    const {register,handleSubmit,reset} = useForm();

    const submitHandler = async (data)=>{
      setErrorMessage('')
      try {
        await axios.post("http://localhost:3000/api/auth/register",{
            fullName: {
                firstName: data.fullName.firstName,
                lastName: data.fullName.lastName
            },
            email: data.email,
            password: data.password
        }, {
            withCredentials: true
        })
        navigate("/login")
        reset()
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Unable to create your account. Please try again.')
      }
    }
    

  return (
    <main className="auth-shell">
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="Mosaic home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MINI-GPT</span>
        </Link>
        <div className="auth-header-actions">
          <span className="auth-header-note">A place to explore</span>
          <ThemeToggle />
        </div>
      </header>
      <section className="auth-grid">
        <div className="auth-story">
          <p className="eyebrow">Make something of a thought</p>
          <h1>Your next good question starts here.</h1>
          <p className="auth-description">Create an account to begin a more thoughtful conversation.</p>
        </div>
        <div className="auth-form-panel">
          <h2>Create your account</h2>
          <p className="form-intro">A few details, then you're ready to begin.</p>
          <form className="auth-form" onSubmit={handleSubmit(submitHandler)}>
            {/* <div className="form-field">
              <label htmlFor="register-full-name">Full name</label>
              <input id="register-full-name" autoComplete="name" {...register("fullname",{required:"title should not be empty"})} type="text" placeholder="Enter your name" />
            </div> */}
            <div className="form-field">
              <label htmlFor="register-first-name">First name</label>
              <input id="register-first-name" autoComplete="given-name" {...register("fullName.firstName",{required:"title should not be empty"})} type="text" placeholder="First name" />
            </div>
            <div className="form-field">
              <label htmlFor="register-last-name">Last name</label>
              <input id="register-last-name" autoComplete="family-name" {...register("fullName.lastName",{required:"title should not be empty"})} type="text" placeholder="Last name" />
            </div>
            <div className="form-field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" autoComplete="email" {...register("email",{required:"title should not be empty"})} type="email" placeholder="you@example.com" />
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" autoComplete="new-password" {...register("password",{required:"title should not be empty"})} type="password" placeholder="Create a password" />
            </div>
            {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
            <button className="button-primary" type="submit">Create account</button>
          </form>
          <p className="form-switch">
            Already have an account? <Link className="text-link" to="/login">Login</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
