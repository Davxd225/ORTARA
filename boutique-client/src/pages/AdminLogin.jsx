import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api.js'
import BrandLogo from '../components/BrandLogo.jsx'

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (sessionStorage.getItem('adminToken')) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      sessionStorage.setItem('adminToken', data.token)
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <Link className="brand" to="/" aria-label="Retour au catalogue">
          <BrandLogo className="brand-logo admin-brand-logo" />
        </Link>
        <p className="eyebrow">Espace sécurisé</p>
        <h1>Bon retour.</h1>
        <p className="login-intro">
          Connectez-vous pour gérer les articles de votre boutique.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            Adresse e-mail
            <input
              className="form-control"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="form-field">
            Mot de passe
            <input
              className="form-control"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="login-footer">
          <Link to="/">Retourner au catalogue</Link>
        </p>
      </section>
    </main>
  )
}

export default AdminLogin
