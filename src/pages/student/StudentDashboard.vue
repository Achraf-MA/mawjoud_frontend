<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '../../stores/auth'
import { useSchedule, DAYS } from '../../composables/useSchedule'
import { useAttendanceHistory } from '../../composables/useAttendance'
import { todayLabel, todayDayName, greeting } from '../../composables/useDate'
import { getSchedule } from '../../services/student'
import { getAttendance } from '../../services/student'

import PageHeader     from '../../components/shared/PageHeader.vue'
import WeeklyTimetable from '../../components/timetable/WeeklyTimetable.vue'
import TodayClasses   from '../../components/timetable/TodayClasses.vue'
import AttendanceRing from '../../components/attendance/AttendanceRing.vue'
import AttendanceTable from '../../components/attendance/AttendanceTable.vue'
import LoadingState   from '../../components/shared/LoadingState.vue'

const { user } = storeToRefs(useAuth())

const sched = useSchedule(getSchedule)
const att   = useAttendanceHistory(getAttendance)

const today     = todayDayName()
const todaySlots = computed(() => sched.sortedSlots(today))

const nextClass = computed(() => {
  const now     = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return todaySlots.value.find(s => {
    const [h, m] = s.starts_at.split(':').map(Number)
    return h * 60 + m > nowMins
  }) ?? null
})

onMounted(async () => {
  await Promise.all([sched.load(), att.load(1)])
})
</script>

<template>
  <div class="page-root">
    <PageHeader
      eyebrow="Student Portal"
      :title="`${greeting()}, ${user?.first_name ?? ''}`"
      :date="todayLabel()"
    />
    <div class="rule" />

    <LoadingState v-if="sched.loading.value && att.loading.value" label="Loading your dashboard…" />

    <template v-else>
      <div class="top-row">
        <div class="card stats-card">
          <div class="card-head"><p class="section-label">Attendance Overview</p></div>
          <div class="rule" />
          <AttendanceRing
            :pct="att.pct.value"
            :present="att.presentCount.value"
            :absent="att.absentCount.value"
            :late="att.lateCount.value"
            :total="att.records.value.length"
          />
        </div>
        <TodayClasses
          :slots="todaySlots"
          :todayName="today"
          :nextClass="nextClass"
        />
      </div>

      <p class="eyebrow" style="margin-top: 0.25rem;">Weekly Timetable</p>
      <WeeklyTimetable
        :schedule="sched.schedule.value"
        :activeDays="sched.activeDays.value"
        :sortedSlots="sched.sortedSlots"
        :slotStyle="sched.slotStyle"
        :todayName="today"
        :nextClassId="nextClass?.id ?? null"
      />

      <p class="eyebrow" style="margin-top: 0.25rem;">Attendance History</p>
      <AttendanceTable
        :records="att.records.value"
        :loading="att.loading.value"
        :page="att.page.value"
        :lastPage="att.lastPage.value"
        @page-change="att.load"
      />
    </template>
  </div>
</template>

<style scoped>
.top-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  align-items: start;
}
.stats-card { overflow: hidden; }

@media (max-width: 900px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
