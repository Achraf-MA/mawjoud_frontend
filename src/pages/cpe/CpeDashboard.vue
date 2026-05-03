<script setup>
import { ref, computed, onMounted } from 'vue'
import { getJustifications, reviewJustification } from '../../services/cpe'

const records  = ref([])
const loading  = ref(true)
const error    = ref('')
const page     = ref(1)
const lastPage = ref(1)

// Filter
const filter = ref('pending') // 'all' | 'pending' | 'accepted' | 'rejected'
const reviewing = ref(null)   // id of the row currently being actioned

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const filtered = computed(() => {
  if (filter.value === 'all') return records.value
  return records.value.filter(r => r.status === filter.value)
})

const pendingCount  = computed(() => records.value.filter(r => r.status === 'pending').length)
const acceptedCount = computed(() => records.value.filter(r => r.status === 'accepted').length)
const rejectedCount = computed(() => records.value.filter(r => r.status === 'rejected').length)

async function load(p = 1) {
  loading.value = true
  error.value   = ''
  try {
    const res  = await getJustifications(p)
    // Surveillant controller returns raw paginator (no ApiResponse wrapper)
    const body = res.data ?? res
    records.value  = body.data   ?? (Array.isArray(body) ? body : [])
    lastPage.value = body.last_page    ?? 1
    page.value     = body.current_page ?? 1
  } catch (e) {
    error.value = e.message || 'Failed to load justifications.'
  } finally {
    loading.value = false
  }
}

async function review(id, status) {
  reviewing.value = id
  try {
    await reviewJustification(id, status)
    // Update local state immediately
    const rec = records.value.find(r => r.id === id)
    if (rec) rec.status = status
  } catch (e) {
    alert(e.message || 'Failed to update justification.')
  } finally {
    reviewing.value = null
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fileUrl(path) {
  if (!path) return null
  return `${BASE_URL}/storage/${path}`
}

onMounted(() => load(1))
</script>

<template>
  <div class="cpe-root">

    <!-- Header -->
    <div class="page-top">
      <div>
        <p class="eyebrow">Surveillance</p>
        <h1 class="page-title">Justification Review</h1>
        <p class="page-subtitle">Review and process absence justifications submitted by parents</p>
      </div>
    </div>
    <div class="rule" style="margin-bottom: 1.75rem;" />

    <!-- Stats -->
    <div class="stats-row" v-if="!loading">
      <div class="stat-card stat-card--pending" @click="filter = 'pending'" :class="{ active: filter === 'pending' }">
        <span class="stat-num">{{ pendingCount }}</span>
        <span class="stat-label">Pending review</span>
        <div class="stat-bar"><div class="stat-fill stat-fill--pending" :style="{ width: records.length ? (pendingCount/records.length*100)+'%' : '0%' }" /></div>
      </div>
      <div class="stat-card stat-card--accepted" @click="filter = 'accepted'" :class="{ active: filter === 'accepted' }">
        <span class="stat-num">{{ acceptedCount }}</span>
        <span class="stat-label">Accepted</span>
        <div class="stat-bar"><div class="stat-fill stat-fill--accepted" :style="{ width: records.length ? (acceptedCount/records.length*100)+'%' : '0%' }" /></div>
      </div>
      <div class="stat-card stat-card--rejected" @click="filter = 'rejected'" :class="{ active: filter === 'rejected' }">
        <span class="stat-num">{{ rejectedCount }}</span>
        <span class="stat-label">Rejected</span>
        <div class="stat-bar"><div class="stat-fill stat-fill--rejected" :style="{ width: records.length ? (rejectedCount/records.length*100)+'%' : '0%' }" /></div>
      </div>
      <div class="stat-card" @click="filter = 'all'" :class="{ active: filter === 'all' }">
        <span class="stat-num" style="color: var(--muted)">{{ records.length }}</span>
        <span class="stat-label">Total</span>
        <div class="stat-bar"><div class="stat-fill" style="width: 100%; background: var(--border-mid)" /></div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="page-state">
      <div class="dot-loader"><span/><span/><span/></div>
      <p>Loading justifications…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="page-error">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="page-empty">
      <div class="empty-icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11" stroke="currentColor" stroke-width="1.2"/>
          <path d="M14 9v6M14 17v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">
        {{ filter === 'pending' ? 'No pending justifications' : `No ${filter} justifications` }}
      </p>
      <p class="empty-sub">
        {{ filter === 'pending' ? 'All caught up — nothing waiting for review.' : 'Switch filter to see other records.' }}
      </p>
      <button v-if="filter !== 'all'" class="btn btn-ghost" @click="filter = 'all'">Show all</button>
    </div>

    <!-- Queue -->
    <div v-else class="queue">
      <div
        v-for="(rec, i) in filtered"
        :key="rec.id"
        class="just-card card"
        :class="`just-card--${rec.status}`"
        :style="{ animationDelay: `${i * 35}ms` }"
      >

        <!-- Card top: student + date + status -->
        <div class="just-card-head">
          <div class="just-who">
            <div class="who-avatar">
              {{ (rec.attendance?.student?.first_name?.[0] ?? '') + (rec.attendance?.student?.last_name?.[0] ?? '') }}
            </div>
            <div class="who-info">
              <p class="who-name">
                {{ rec.attendance?.student?.first_name }} {{ rec.attendance?.student?.last_name }}
              </p>
              <p class="who-meta">
                Absent on {{ formatDate(rec.attendance?.date) }}
                <span v-if="rec.attendance?.subject?.name"> · {{ rec.attendance.subject.name }}</span>
              </p>
            </div>
          </div>

          <div class="just-status-wrap">
            <span class="status-pill" :class="`pill--${rec.status}`">{{ rec.status }}</span>
            <span v-if="rec.reviewed_at" class="reviewed-at">{{ formatDate(rec.reviewed_at) }}</span>
          </div>
        </div>

        <div class="rule" style="margin: 0.85rem 0;" />

        <!-- Comment + file -->
        <div class="just-content">
          <div v-if="rec.comment" class="just-comment">
            <p class="content-label">Parent's comment</p>
            <p class="comment-text">{{ rec.comment }}</p>
          </div>

          <div v-if="rec.file_path" class="just-file">
            <p class="content-label">Attached document</p>
            <a :href="fileUrl(rec.file_path)" target="_blank" rel="noopener" class="file-link">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 2h5.5L11 4.5V12H3V2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M8 2v3h3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              View document
            </a>
          </div>

          <p v-if="!rec.comment && !rec.file_path" class="no-content">
            No comment or document provided.
          </p>
        </div>

        <!-- Actions — only for pending -->
        <div v-if="rec.status === 'pending'" class="just-actions">
          <button
            class="btn btn-accept"
            :disabled="reviewing === rec.id"
            @click="review(rec.id, 'accepted')"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Accept
          </button>
          <button
            class="btn btn-reject"
            :disabled="reviewing === rec.id"
            @click="review(rec.id, 'rejected')"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            Reject
          </button>
          <span v-if="reviewing === rec.id" class="dot-loader" style="margin-left: 0.5rem;"><span/><span/><span/></span>
        </div>

        <!-- Processed note -->
        <div v-else class="just-processed">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.1"/>
            <path d="M4 6.5l2 2 3-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Processed {{ formatDate(rec.reviewed_at) }}
        </div>

      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="!loading && lastPage > 1">
      <button class="btn btn-ghost" :disabled="page <= 1" @click="load(page - 1)">Previous</button>
      <span class="page-indicator">Page {{ page }} of {{ lastPage }}</span>
      <button class="btn btn-ghost" :disabled="page >= lastPage" @click="load(page + 1)">Next</button>
    </div>

  </div>
</template>

<style scoped>
.cpe-root { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-top { margin-bottom: 0.25rem; }
.page-title {
  font-family: var(--ff-serif);
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 500; color: var(--text);
  margin-top: 0.4rem; line-height: 1.1;
}
.page-subtitle { font-size: 0.82rem; color: var(--muted); margin-top: 0.35rem; }

/* States */
.page-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
  padding: 4rem; color: var(--muted); font-size: 0.82rem;
}
.page-error {
  background: rgba(176,48,48,0.06); border: 1px solid rgba(176,48,48,0.2);
  border-radius: var(--radius); padding: 0.85rem 1rem;
  font-size: 0.82rem; color: #b03030;
}
.page-empty {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.85rem;
  padding: 4rem 2rem; text-align: center;
}
.empty-icon {
  width: 56px; height: 56px; border-radius: 50%;
  border: 1px solid var(--border-mid);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-lt);
}
.empty-title { font-family: var(--ff-serif); font-size: 1.05rem; font-weight: 500; color: var(--text); }
.empty-sub { font-size: 0.8rem; color: var(--muted); }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.85rem; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 4px;
  cursor: pointer; transition: border-color 0.18s, box-shadow 0.18s;
}
.stat-card:hover { border-color: var(--border-strong); }
.stat-card.active { border-color: var(--accent-lt); box-shadow: 0 0 0 3px var(--accent-dim); }

.stat-num {
  font-family: var(--ff-serif); font-size: 1.9rem;
  font-weight: 500; line-height: 1;
}
.stat-card--pending  .stat-num { color: #b87a00; }
.stat-card--accepted .stat-num { color: var(--accent); }
.stat-card--rejected .stat-num { color: #b03030; }

.stat-label {
  font-size: 0.62rem; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 6px;
}
.stat-bar { height: 3px; background: var(--border-mid); border-radius: 2px; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.stat-fill--pending  { background: #b87a00; }
.stat-fill--accepted { background: var(--accent); }
.stat-fill--rejected { background: #b03030; }

/* Queue */
.queue { display: flex; flex-direction: column; gap: 1rem; }

/* Justification card */
.just-card {
  padding: 1.25rem 1.5rem;
  animation: cardIn 0.3s ease both;
  border-left: 3px solid var(--border-mid);
}
.just-card--pending  { border-left-color: #b87a00; }
.just-card--accepted { border-left-color: var(--accent); }
.just-card--rejected { border-left-color: #b03030; }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Card head */
.just-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.just-who { display: flex; align-items: center; gap: 0.85rem; }
.who-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--accent-dim); border: 1px solid var(--border-mid);
  color: var(--accent); font-size: 0.7rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; text-transform: uppercase;
}
.who-name { font-size: 0.95rem; font-weight: 600; color: var(--text); }
.who-meta { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }

.just-status-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.reviewed-at { font-size: 0.65rem; color: var(--muted); }

/* Status pills */
.status-pill {
  display: inline-block; font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 0.22rem 0.7rem; border-radius: 20px;
  border: 1px solid transparent;
}
.pill--pending  { color: #b87a00; background: rgba(184,122,0,0.08); border-color: rgba(184,122,0,0.25); }
.pill--accepted { color: var(--accent); background: var(--accent-dim); border-color: var(--border-strong); }
.pill--rejected { color: #b03030; background: rgba(176,48,48,0.07); border-color: rgba(176,48,48,0.22); }

/* Content */
.just-content { display: flex; flex-direction: column; gap: 0.85rem; }
.content-label {
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 0.35rem;
}
.comment-text {
  font-size: 0.875rem; color: var(--text-mid);
  line-height: 1.6; font-style: italic;
  font-family: var(--ff-serif);
}
.no-content { font-size: 0.78rem; color: var(--muted-lt); font-style: italic; }

.file-link {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 500; color: var(--accent);
  text-decoration: none; border-bottom: 1px solid var(--border-strong);
  padding-bottom: 1px; transition: color 0.15s;
}
.file-link:hover { color: var(--accent-mid); }

/* Actions */
.just-actions { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.25rem; }

.btn-accept, .btn-reject {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-family: var(--ff-sans); font-size: 0.7rem; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.5rem 1rem; border-radius: var(--radius);
  cursor: pointer; transition: all 0.15s;
  border: 1px solid;
}
.btn-accept {
  background: var(--accent-dim); color: var(--accent);
  border-color: var(--border-strong);
}
.btn-accept:hover { background: var(--accent); color: #fff; box-shadow: 0 3px 12px var(--accent-glow); }

.btn-reject {
  background: rgba(176,48,48,0.06); color: #b03030;
  border-color: rgba(176,48,48,0.25);
}
.btn-reject:hover { background: #b03030; color: #fff; box-shadow: 0 3px 12px rgba(176,48,48,0.25); }

.btn-accept:disabled, .btn-reject:disabled { opacity: 0.45; cursor: not-allowed; }

.just-processed {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.72rem; color: var(--muted);
  margin-top: 0.25rem;
}

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 1.25rem; padding-top: 0.5rem; }
.page-indicator { font-size: 0.78rem; color: var(--muted); }

@media (max-width: 640px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .just-card-head { flex-direction: column; }
  .just-status-wrap { flex-direction: row; align-items: center; }
}
</style>
