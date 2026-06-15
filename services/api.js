import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://scholarsnudge.com/api'
const client = axios.create({ baseURL: API_BASE, timeout: 15000 })

function resolveToken(explicitToken) {
  if (explicitToken) return explicitToken
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('admin_token')
    if (saved) return saved
  }
  return process.env.NEXT_PUBLIC_API_TOKEN || ''
}

function authConfig(token, extra = {}) {
  const resolved = resolveToken(token)
  const headers = resolved ? { Authorization: `Bearer ${resolved}` } : {}
  return {
    ...extra,
    headers: { ...(extra.headers || {}), ...headers },
  }
}

// ── Auth ──
export async function login(credential, password) {
  const payload = credential.includes('@') ? { email: credential } : { matric_number: credential }
  payload.password = password
  const res = await client.post('/auth/login', payload)
  return res.data
}

export async function getMe(token) {
  const res = await client.get('/auth/me', authConfig(token))
  return res.data
}

// ── Admin Dashboard ──
export async function getDashboardSummary(token) {
  const res = await client.get('/admin/dashboard/summary', authConfig(token))
  return res.data
}

export async function getWeeklyAttendanceStats(token) {
  const res = await client.get('/admin/dashboard/weekly-attendance', authConfig(token))
  return res.data
}

// ── Admin Users ──
export async function getUsers(token, params = {}) {
  const res = await client.get('/admin/users', authConfig(token, { params }))
  return res.data
}

export async function createUser(payload, token) {
  const res = await client.post('/admin/users', payload, authConfig(token))
  return res.data
}

export async function updateUser(userId, payload, token) {
  const res = await client.put(`/admin/users/${userId}`, payload, authConfig(token))
  return res.data
}

export async function deleteUser(userId, token) {
  const res = await client.delete(`/admin/users/${userId}`, authConfig(token))
  return res.data
}

export async function importUsersCsv(file, token) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/admin/users/import', formData, authConfig(token, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }))
  return res.data
}

// ── Admin Faculties / Departments / Levels ──
export async function getFaculties(token) {
  const res = await client.get('/admin/faculties', authConfig(token))
  return res.data
}

export async function createFaculty(payload, token) {
  const res = await client.post('/admin/faculties', payload, authConfig(token))
  return res.data
}

export async function getDepartments(token, facultyId) {
  const params = facultyId ? { faculty_id: facultyId } : {}
  const res = await client.get('/admin/departments', authConfig(token, { params }))
  return res.data
}

export async function createDepartment(payload, token) {
  const res = await client.post('/admin/departments', payload, authConfig(token))
  return res.data
}

export async function getLevels(token) {
  const res = await client.get('/admin/levels', authConfig(token))
  return res.data
}

export async function getAcademicLevels() {
  const res = await client.get('/academic/levels')
  return res.data
}

export async function createLevel(payload, token) {
  const res = await client.post('/admin/levels', payload, authConfig(token))
  return res.data
}

// ── Admin User Detail ──
export async function getAdminUser(userId, token) {
  const res = await client.get(`/admin/users/${userId}`, authConfig(token))
  return res.data
}

// ── Admin Lecturer Management ──
export async function getAdminLecturerCourses(lecturerId, token) {
  const res = await client.get(`/admin/lecturers/${lecturerId}/courses`, authConfig(token))
  return res.data
}

export async function getAdminLecturerSessions(lecturerId, token, params = {}) {
  const res = await client.get(`/admin/lecturers/${lecturerId}/sessions`, authConfig(token, { params }))
  return res.data
}

export async function getAdminLecturerAttendanceSummary(lecturerId, token) {
  const res = await client.get(`/admin/lecturers/${lecturerId}/attendance-summary`, authConfig(token))
  return res.data
}

// ── Admin Student Management ──
export async function getStudentAttendance(studentId, token, params = {}) {
  const res = await client.get(`/admin/students/${studentId}/attendance`, authConfig(token, { params }))
  return res.data
}

// ── Admin Courses ──
export async function getAdminCourses(token, params = {}) {
  const res = await client.get('/admin/courses', authConfig(token, { params }))
  return res.data
}

export async function getAdminCourseDetail(courseId, token) {
  const res = await client.get(`/admin/courses/${courseId}`, authConfig(token))
  return res.data
}

export async function getAdminCourseSessions(courseId, token, params = {}) {
  const res = await client.get(`/admin/courses/${courseId}/sessions`, authConfig(token, { params }))
  return res.data
}

// ── Admin Sessions ──
export async function getAdminSessions(token, params = {}) {
  const res = await client.get('/admin/sessions', authConfig(token, { params }))
  return res.data
}

export async function getAdminSessionDetail(sessionId, token) {
  const res = await client.get(`/admin/sessions/${sessionId}`, authConfig(token))
  return res.data
}

export async function getAdminSessionAttendances(sessionId, token, params = {}) {
  const res = await client.get(`/admin/sessions/${sessionId}/attendance`, authConfig(token, { params }))
  return res.data
}

// ── Lecturer Endpoints ──
export async function getLecturerCourses(token) {
  const res = await client.get('/lecturer/courses', authConfig(token))
  return res.data
}

export async function createCourse(payload, token) {
  const res = await client.post('/lecturer/courses', payload, authConfig(token))
  return res.data
}

export async function updateCourse(courseId, payload, token) {
  const res = await client.put(`/lecturer/courses/${courseId}`, payload, authConfig(token))
  return res.data
}

export async function deleteCourse(courseId, token) {
  const res = await client.delete(`/lecturer/courses/${courseId}`, authConfig(token))
  return res.data
}

export async function updateCourseLocation(courseId, payload, token) {
  const res = await client.put(`/lecturer/courses/${courseId}/location`, payload, authConfig(token))
  return res.data
}

export async function getCourseSessions(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}`, authConfig(token))
  return res.data
}

export async function createSession(courseId, payload, token) {
  const res = await client.post(`/lecturer/courses/${courseId}/sessions`, payload, authConfig(token))
  return res.data
}

export async function stopSession(sessionId, token) {
  const res = await client.post(`/lecturer/sessions/${sessionId}/stop`, {}, authConfig(token))
  return res.data
}

export async function cancelSession(sessionId, token) {
  const res = await client.post(`/lecturer/sessions/${sessionId}/cancel`, {}, authConfig(token))
  return res.data
}

export async function getSessionReport(sessionId, token) {
  const res = await client.get(`/lecturer/sessions/${sessionId}/report`, authConfig(token))
  return res.data
}

export async function getLiveSessionFeed(sessionId, token) {
  const res = await client.get(`/lecturer/sessions/${sessionId}/live`, authConfig(token))
  return res.data
}

export async function markStudentPresent(sessionId, studentId, token) {
  const res = await client.post(`/lecturer/sessions/${sessionId}/students/${studentId}/present`, {}, authConfig(token))
  return res.data
}

export async function markStudentPresentByMatric(sessionId, matric, token) {
  const res = await client.post(`/lecturer/sessions/${sessionId}/mark-by-matric`, { matric_number: matric }, authConfig(token))
  return res.data
}

export async function updateAttendanceStatus(attendanceId, status, token) {
  const res = await client.post(`/lecturer/attendance/${attendanceId}/status`, { status }, authConfig(token))
  return res.data
}

export async function deleteAttendance(attendanceId, token) {
  const res = await client.delete(`/lecturer/attendance/${attendanceId}`, authConfig(token))
  return res.data
}

export async function getCourseAttendance(courseId, token, params = {}) {
  const res = await client.get(`/lecturer/courses/${courseId}/attendance`, authConfig(token, { params }))
  return res.data
}

export async function getCourseAnalytics(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}/analytics`, authConfig(token))
  return res.data
}

export async function getCourseRoster(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}/roster`, authConfig(token))
  return res.data
}

export async function addStudentToRoster(courseId, matric, name, token) {
  const res = await client.post(`/lecturer/courses/${courseId}/roster/add`, { matric_number: matric, student_name: name }, authConfig(token))
  return res.data
}

export async function removeStudentFromRoster(courseId, matric, token) {
  const res = await client.delete(`/lecturer/courses/${courseId}/roster/${matric}`, authConfig(token))
  return res.data
}

export async function importRosterCsv(courseId, file, token) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post(`/lecturer/courses/${courseId}/roster/import`, formData, authConfig(token, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }))
  return res.data
}

export async function getTimetableSlots(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}/timetable`, authConfig(token))
  return res.data
}

export async function createTimetableSlot(courseId, payload, token) {
  const res = await client.post(`/lecturer/courses/${courseId}/timetable`, payload, authConfig(token))
  return res.data
}

export async function deleteTimetableSlot(slotId, token) {
  const res = await client.delete(`/lecturer/timetable/${slotId}`, authConfig(token))
  return res.data
}

// ── Lecturer Venues ──
export async function getCourseVenues(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}/venues`, authConfig(token))
  return res.data
}

export async function createCourseVenue(courseId, payload, token) {
  const res = await client.post(`/lecturer/courses/${courseId}/venues`, payload, authConfig(token))
  return res.data
}

export async function updateVenue(venueId, payload, token) {
  const res = await client.put(`/lecturer/venues/${venueId}`, payload, authConfig(token))
  return res.data
}

export async function deleteVenue(venueId, token) {
  const res = await client.delete(`/lecturer/venues/${venueId}`, authConfig(token))
  return res.data
}

// ── Lecturer Session Templates ──
export async function getSessionTemplates(token) {
  const res = await client.get('/lecturer/session-templates', authConfig(token))
  return res.data
}

export async function createSessionTemplate(payload, token) {
  const res = await client.post('/lecturer/session-templates', payload, authConfig(token))
  return res.data
}

// ── Lecturer Course Sharing ──
export async function getCourseShares(courseId, token) {
  const res = await client.get(`/lecturer/courses/${courseId}/shares`, authConfig(token))
  return res.data
}

export async function shareCourse(courseId, lecturerId, token) {
  const res = await client.post(`/lecturer/courses/${courseId}/shares`, { shared_with_user_id: lecturerId }, authConfig(token))
  return res.data
}

export async function removeCourseShare(courseId, shareId, token) {
  const res = await client.delete(`/lecturer/courses/${courseId}/shares/${shareId}`, authConfig(token))
  return res.data
}

export async function getSharedCourses(token) {
  const res = await client.get('/lecturer/shared-courses', authConfig(token))
  return res.data
}

// ── Student Endpoints ──
export async function getStudentActiveSessions(token) {
  const res = await client.get('/student/sessions/active', authConfig(token))
  return res.data
}

export async function getStudentAttendanceHistory(token, params = {}) {
  const res = await client.get('/student/attendance/history', authConfig(token, { params }))
  return res.data
}

export async function getStudentTimetable(token) {
  const res = await client.get('/student/timetable', authConfig(token))
  return res.data
}

export async function getStudentAttendanceReport(token) {
  const res = await client.get('/reports/attendance', authConfig(token))
  return res.data
}

export async function getStudentCourseAttendanceReport(courseId, token) {
  const res = await client.get(`/reports/attendance/course/${courseId}`, authConfig(token))
  return res.data
}

export async function getStudentFaceStatus(token) {
  const res = await client.get('/student/face/status', authConfig(token))
  return res.data
}

// ── Lecturer enhancements ──
export async function getLecturerSessionReport(sessionId, token) {
  const res = await client.get(`/lecturer/sessions/${sessionId}/report`, authConfig(token))
  return res.data
}

export async function getLecturerSessionTemplates(token) {
  const res = await client.get('/lecturer/session-templates', authConfig(token))
  return res.data
}

export async function createLecturerSessionTemplate(payload, token) {
  const res = await client.post('/lecturer/session-templates', payload, authConfig(token))
  return res.data
}

export async function deleteLecturerSessionTemplate(templateId, token) {
  const res = await client.delete(`/lecturer/session-templates/${templateId}`, authConfig(token))
  return res.data
}

export async function getLecturerSwapRequestsSent(token) {
  const res = await client.get('/lecturer/swap-requests/sent', authConfig(token))
  return res.data
}

export async function getLecturerSwapRequestsReceived(token) {
  const res = await client.get('/lecturer/swap-requests/received', authConfig(token))
  return res.data
}

export async function createLecturerSwapRequest(payload, token) {
  const res = await client.post('/lecturer/swap-requests', payload, authConfig(token))
  return res.data
}

export async function respondLecturerSwapRequest(swapId, payload, token) {
  const res = await client.put(`/lecturer/swap-requests/${swapId}`, payload, authConfig(token))
  return res.data
}

export default client
