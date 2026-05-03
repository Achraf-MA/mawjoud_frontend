<script setup>
import { ref } from 'vue'
import { login } from '../services/auth'
import { useAuth } from '../stores/auth'

const authStore = useAuth()
const { setUser } = authStore

const props = defineProps({
  theme: { type: String, default: 'light' }
})
const emit = defineEmits(['toggle-theme'])
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref(null)
const focused  = ref(null)

async function handleLogin() {
  error.value   = null
  loading.value = true
  try {
    const res = await login(email.value, password.value)
    setUser(res.data)
  } catch (err) {
    error.value = err.message || 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="scene">

    <!-- Theme toggle -->
    <div class="scene-controls">
      <button class="theme-toggle" @click="emit('toggle-theme')" aria-label="Toggle theme" />
    </div>

    <!-- Left panel — identity -->
    <aside class="panel-identity">
      <div class="identity-inner">
        <div class="institution-crest">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="2" y="2" width="44" height="44" rx="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M24 8 L24 40 M8 24 L40 24" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="24" cy="24" r="7" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="24" cy="24" r="2" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="institution-name">Mawjoud</h1>
        <p class="institution-tagline">Academic Management System</p>
        <div class="identity-rule" />
        <p class="institution-motto">
          <em>Excellence through rigour and discipline</em>
        </p>
      </div>
      <p class="identity-year">Est. 2024</p>
    </aside>

    <!-- Right panel — form -->
    <main class="panel-form">
      <div class="form-inner">

        <header class="form-header">
          <p class="eyebrow">Restricted access</p>
          <h2 class="form-title">Sign in to your account</h2>
        </header>

        <form class="form" @submit.prevent="handleLogin" novalidate>

          <div class="field" :class="{ 'field--active': focused === 'email' || email }">
            <label class="field-label" for="email">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="name@institution.edu"
              required
              @focus="focused = 'email'"
              @blur="focused = null"
            />
          </div>

          <div class="field" :class="{ 'field--active': focused === 'password' || password }">
            <label class="field-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••••"
              required
              @focus="focused = 'password'"
              @blur="focused = null"
            />
          </div>

          <Transition name="err">
            <div v-if="error" class="error-box" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
                <path d="M7 4v4M7 9.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ error }}
            </div>
          </Transition>

          <button type="submit" class="btn btn-submit" :disabled="loading">
            <span v-if="!loading">Sign in</span>
            <span v-else class="dot-loader"><span/><span/><span/></span>
          </button>

        </form>

        <footer class="form-footer">
          <p>Contact your administrator if you have trouble accessing your account.</p>
        </footer>

      </div>
    </main>

  </div>
</template>

<style scoped>
.scene {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
  background: var(--bg);
}

/* ── Controls ── */
.scene-controls {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 10;
}

/* ── Identity panel ── */
.panel-identity {
  background: var(--accent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 4rem 3rem;
  position: relative;
  overflow: hidden;
}

/* Subtle texture lines */
.panel-identity::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 39px,
    rgba(255,255,255,0.03) 39px,
    rgba(255,255,255,0.03) 40px
  );
}

.identity-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.institution-crest {
  color: rgba(255,255,255,0.7);
  margin-bottom: 0.5rem;
}

.institution-name {
  font-family: var(--ff-serif);
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 500;
  color: #fff;
  letter-spacing: 0.08em;
  line-height: 1;
}

.institution-tagline {
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.55);
}

.identity-rule {
  width: 40px;
  height: 1px;
  background: rgba(255,255,255,0.25);
}

.institution-motto {
  font-family: var(--ff-serif);
  font-size: 0.95rem;
  font-weight: 400;
  font-style: italic;
  color: rgba(255,255,255,0.65);
  line-height: 1.6;
  max-width: 220px;
}

.identity-year {
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  position: relative;
  z-index: 1;
}

/* ── Form panel ── */
.panel-form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: var(--surface);
}

.form-inner {
  width: 100%;
  max-width: 380px;
}

.form-header { margin-bottom: 2.5rem; }
.form-title {
  font-family: var(--ff-serif);
  font-size: 1.9rem;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.01em;
  margin-top: 0.5rem;
  line-height: 1.15;
}

/* ── Form fields ── */
.form { display: flex; flex-direction: column; gap: 1.4rem; }

.field { display: flex; flex-direction: column; gap: 0.45rem; }

.field input {
  background: var(--bg);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--ff-sans);
  font-size: 0.9rem;
  padding: 0.7rem 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
.field input::placeholder { color: var(--muted-lt); }
.field--active input,
.field input:focus {
  border-color: var(--accent-lt);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

/* ── Error ── */
.error-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #b03030;
  background: #fdf2f2;
  border: 1px solid rgba(176,48,48,0.18);
  border-radius: var(--radius);
  padding: 0.65rem 0.85rem;
}

[data-theme="dark"] .error-box {
  color: #e88080;
  background: rgba(176,48,48,0.1);
  border-color: rgba(176,48,48,0.25);
}

.err-enter-active, .err-leave-active { transition: opacity 0.25s, transform 0.25s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Submit ── */
.btn-submit {
  width: 100%;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  border: 1px solid var(--accent);
  padding: 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  margin-top: 0.5rem;
}
.btn-submit:hover:not(:disabled) {
  background: var(--accent-mid);
  border-color: var(--accent-mid);
  box-shadow: 0 4px 20px var(--accent-glow);
  transform: translateY(-1px);
}
.btn-submit:active:not(:disabled) { transform: translateY(0); }

/* ── Footer ── */
.form-footer {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}
.form-footer p {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.6;
  text-align: center;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .scene {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .panel-identity {
    padding: 2.5rem 2rem;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    min-height: unset;
  }
  .identity-inner { flex-direction: row; text-align: left; gap: 1.25rem; align-items: center; }
  .identity-rule, .institution-motto, .identity-year { display: none; }
  .institution-crest svg { width: 32px; height: 32px; }
  .institution-name { font-size: 1.5rem; }
  .panel-form { padding: 2.5rem 1.5rem; align-items: flex-start; }
  .form-inner { max-width: 100%; }
  .scene-controls { top: 1rem; right: 1rem; }
}
</style>
