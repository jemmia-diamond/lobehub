/**
 * Maps R2 storage filenames to their corresponding Lark Wiki URLs.
 * When a citation link points to an R2 file, clicking it opens the Lark document instead.
 *
 * Key: filename (decoded, without path prefix)
 * Value: Lark Wiki URL
 */
export const R2_TO_LARK_MAP: Record<string, string> = {
  'Hướng Dẫn Sử Dụng Lark Approval.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/ZByVw6jQDiEbKFk55eYlYj3ggUg',
  'Hướng dẫn chấm công bằng Lark Attendance.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/TJKkwR1NliPvZnkssh0ltm9ygHI',
  'Quy Định Về Chấm Công Dành Cho Nhân Viên.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/ED1EwTnDAixs6fkWLZxlIq5NgTh',
  'Hướng Dẫn Đọc Kết Quả Chấm Công & Sử Dụng Lark Attendance.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/MOUNwxiHaiKS6tkmoWgliXrIgWg',
  'Jemmia - Chính sách Phúc lợi.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/FX5Lwyh2UiT6SGkLv3xlMgQfgRd',
  'Quy định số 022025.QĐN-JEMMIA Vv Quy định về Trang phục nhân viên ký ngày 06.10.2025.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/UhsDwYeCsiIszHkxyOYlXzmeg4d',
  'Jemmia - Nội quy lao động - Cập nhật 25.12.2024.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/MipvwSQbWijX9Tk1LJAl5jsWgMc',
  'Thông báo thay đổi giờ làm việc số 032025.TB-JEMMIA.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/ThjmwsWIbiAQ5lkeb1Rljhhzgke',
  'Thông báo nghỉ lễ Giỗ Tổ-30.4-1.5.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/S2BgwRc5HiFDQwkW0f2l3F8kgag',
  'Sổ Tay Hội Nhập Lark Suite.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/Z4nrwrAB4iA7F6kxYdWlkzc1gEf',
  'Sổ Tay Lark Suite Cho Người Dùng.md':
    'https://jemmiadiamond.sg.larksuite.com/wiki/SC0lw8LGji8wFOkJ9qClZEergAd',
};

const R2_HOST = 'r2.cloudflarestorage.com';

/**
 * Given an R2 URL, returns the corresponding Lark Wiki URL if a mapping exists.
 * Returns null if no mapping is found (caller should use the original URL or show plain text).
 */
export const getLarkUrlForR2 = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(R2_HOST)) return null;

    // Extract filename from path: /lobe/knowledges/ENCODED_FILENAME.md
    const pathParts = parsed.pathname.split('/');
    const encodedFilename = pathParts.at(-1);
    if (!encodedFilename) return null;

    const filename = decodeURIComponent(encodedFilename);
    return R2_TO_LARK_MAP[filename] ?? null;
  } catch {
    return null;
  }
};
