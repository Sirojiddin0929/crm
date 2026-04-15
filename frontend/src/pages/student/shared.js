import dayjs from 'dayjs';

export const DAYS_UZ = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Ch',
  THURSDAY: 'Pa',
  FRIDAY: 'Ju',
  SATURDAY: 'Sh',
  SUNDAY: 'Ya',
};

export function getHomeworkCreatedAt(item) {
  return item?.createdAt || item?.created_at || null;
}

export function getHomeworkDeadline(item) {
  const createdAt = getHomeworkCreatedAt(item);
  if (!createdAt) return null;
  return dayjs(createdAt).add(Number(item?.durationTime || 0), 'hour');
}

export function getHomeworkStatus(hw, resp, res) {
  if (!hw) return { label: 'Berilmagan', className: 'bg-gray-500/20 text-gray-500' };
  if (res) {
    if (res.status === 'APPROVED') return { label: 'Qabul qilindi', className: 'bg-green-500/10 text-green-500' };
    if (res.status === 'REJECTED') return { label: 'Rad etildi', className: 'bg-red-500/10 text-red-500' };
    return { label: res.status, className: 'bg-amber-500/10 text-amber-500' };
  }
  if (resp) return { label: 'Topshirilgan', className: 'bg-blue-500/10 text-blue-500' };
  return { label: 'Berilgan', className: 'bg-gray-500/20 text-gray-500' };
}

export function getUploadUrl(filePath) {
  if (!filePath) return '';
  if (String(filePath).startsWith('http')) return filePath;
  const filename = String(filePath).split('/').pop();
  return `/api/uploads/${filename}`;
}
