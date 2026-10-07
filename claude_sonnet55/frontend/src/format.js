const pad = (n) => String(n).padStart(2, '0')

// 서버가 내려주는 ISO 문자열(예: 2026-10-07T14:29:30.237)을 화면용으로 변환
export function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDateTime(iso) {
  const d = new Date(iso)
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
