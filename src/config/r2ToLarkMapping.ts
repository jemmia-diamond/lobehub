/**
 * Single source of truth for Jemmia Diamond knowledge file mappings.
 *
 * Each entry maps:
 *   filename → { larkUrl, label }
 *
 * - larkUrl: Lark Wiki URL opened when user clicks a citation
 * - label:   Human-readable Vietnamese label used in web browsing systemRole
 *
 * When adding/renaming knowledge files, update ONLY this file.
 * Both r2ToLark redirect and web browsing systemRole are generated from here.
 */

export const R2_BUCKET_HOST = '90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com';
export const R2_KNOWLEDGE_PATH = '/lobe/knowledges/';

export interface KnowledgeFileEntry {
  label: string;
  larkUrl: string;
}

export const JEMMIA_KNOWLEDGE_FILES: Record<string, KnowledgeFileEntry> = {
  '1 - Basic company info - Thông tin cơ bản về Jemmia.md': {
    label: 'Thông tin cơ bản về Jemmia',
    larkUrl: '',
  },
  '2 - Organizational structure - Cơ cấu tổ chức.md': {
    label: 'Cơ cấu tổ chức',
    larkUrl: '',
  },
  '3 - Location - Vị trí công ty Jemmia.md': {
    label: 'Vị trí công ty Jemmia',
    larkUrl: '',
  },
  '4 - Contact for support - Thông tin liên hệ để hỗ trợ.md': {
    label: 'Thông tin liên hệ hỗ trợ',
    larkUrl: '',
  },
  '5 - Brand information - Thông tin về thương hiệu.md': {
    label: 'Thông tin thương hiệu',
    larkUrl: '',
  },
  '6 - Basic product info - Sản Phẩm Của Jemmia.md': {
    label: 'Sản phẩm của Jemmia',
    larkUrl: '',
  },
  '7 - Product quality - Chất lượng sản phẩm.md': {
    label: 'Chất lượng sản phẩm',
    larkUrl: '',
  },
  '8 - Diamond know - Kiến thức về kim cương.md': {
    label: 'Kiến thức về kim cương',
    larkUrl: '',
  },
  'Hướng Dẫn Sử Dụng Lark Approval.md': {
    label: 'Hướng Dẫn Lark Approval',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/ZByVw6jQDiEbKFk55eYlYj3ggUg',
  },
  'Hướng dẫn chấm công bằng Lark Attendance.md': {
    label: 'Hướng Dẫn Chấm Công Lark',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/TJKkwR1NliPvZnkssh0ltm9ygHI',
  },
  'Quy Định Về Chấm Công Dành Cho Nhân Viên.md': {
    label: 'Quy Định Chấm Công',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/ED1EwTnDAixs6fkWLZxlIq5NgTh',
  },
  'Hướng Dẫn Đọc Kết Quả Chấm Công & Sử Dụng Lark Attendance.md': {
    label: 'Hướng Dẫn Đọc Kết Quả Chấm Công',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/MOUNwxiHaiKS6tkmoWgliXrIgWg',
  },
  'Jemmia - Chính sách Phúc lợi.md': {
    label: 'Chính sách Phúc lợi',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/FX5Lwyh2UiT6SGkLv3xlMgQfgRd',
  },
  'Quy định số 022025.QĐN-JEMMIA Vv Quy định về Trang phục nhân viên ký ngày 06.10.2025.md': {
    label: 'Quy định Trang phục',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/UhsDwYeCsiIszHkxyOYlXzmeg4d',
  },
  'Jemmia - Nội quy lao động - Cập nhật 25.12.2024.md': {
    label: 'Nội quy & Quy định',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/MipvwSQbWijX9Tk1LJAl5jsWgMc',
  },
  'Thông báo thay đổi giờ làm việc số 032025.TB-JEMMIA.md': {
    label: 'Thay đổi giờ làm',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/ThjmwsWIbiAQ5lkeb1Rljhhzgke',
  },
  'Thông báo nghỉ lễ Giỗ Tổ-30.4-1.5.md': {
    label: 'Thông báo Nghỉ lễ',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/S2BgwRc5HiFDQwkW0f2l3F8kgag',
  },
  'Sổ Tay Hội Nhập Lark Suite.md': {
    label: 'Sổ Tay Hội Nhập Lark Suite',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/Z4nrwrAB4iA7F6kxYdWlkzc1gEf',
  },
  'Sổ Tay Lark Suite Cho Người Dùng.md': {
    label: 'Sổ Tay Lark Suite',
    larkUrl: 'https://jemmiadiamond.sg.larksuite.com/wiki/SC0lw8LGji8wFOkJ9qClZEergAd',
  },
};

/** Derived: filename → larkUrl (for backward-compat and getLarkUrlForR2) */
export const R2_TO_LARK_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(JEMMIA_KNOWLEDGE_FILES).map(([filename, { larkUrl }]) => [filename, larkUrl]),
);

/** Build the full R2 URL for a knowledge filename */
export const getR2Url = (filename: string): string =>
  `https://${R2_BUCKET_HOST}${R2_KNOWLEDGE_PATH}${encodeURIComponent(filename)}`;

/** Build the jemmia_diamond_knowledge_base bullet list for web browsing systemRole */
export const buildKnowledgeBaseList = (): string =>
  Object.entries(JEMMIA_KNOWLEDGE_FILES)
    .map(([filename, { label, larkUrl }]) =>
      `- ${label}\n  - crawl: ${getR2Url(filename)}\n  - cite: ${larkUrl}`,
    )
    .join('\n');

const R2_HOST = 'r2.cloudflarestorage.com';

/**
 * Given an R2 URL, returns the corresponding Lark Wiki URL if a mapping exists.
 * Returns null if no mapping is found.
 */
export const getLarkUrlForR2 = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(R2_HOST)) return null;

    const pathParts = parsed.pathname.split('/');
    const encodedFilename = pathParts.at(-1);
    if (!encodedFilename) return null;

    const filename = decodeURIComponent(encodedFilename);
    const larkUrl = R2_TO_LARK_MAP[filename];
    return larkUrl || null;
  } catch {
    return null;
  }
};
