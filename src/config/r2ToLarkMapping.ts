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
  '062024_TB-JEMMIA_Thông báo Điều chỉnh chính sách Referral & Affiliate.md': {
    label: 'Chính sách Referral & Affiliate',
    larkUrl: '',
  },
  '2.3 [Jemmia] - Chính sách ưu đãi mua hàng dành cho nhân viên - 24.01.2024 (đang áp dụng).pdf.md': {
    label: 'Ưu đãi mua hàng cho nhân viên',
    larkUrl: '',
  },
  '260320_012026.QĐN-JEMMIA_V.v Su dung Petty Cash tai Cua hang .md': {
    label: 'Sử dụng Petty Cash',
    larkUrl: '',
  },
  'Hướng Dẫn Sử Dụng Hệ Thống Chấm Công Dành Cho Phòng Nhân Sự.md': {
    label: 'Hệ thống chấm công cho Nhân sự',
    larkUrl: '',
  },
  'Hướng Dẫn Sử Dụng Quy Trình Trên Lark.md': {
    label: 'Hướng dẫn quy trình Lark',
    larkUrl: '',
  },
  'Hướng Dẫn Tạo Sự Kiện Chung Toàn Công Ty.md': {
    label: 'Hướng dẫn tạo sự kiện công ty',
    larkUrl: '',
  },
  'Jemmia- TB Phụ cấp hỗ trợ chi phí trang điểm cho NVKD Offline T10.2024.md': {
    label: 'Phụ cấp trang điểm NVKD',
    larkUrl: '',
  },
  'Quy định số 012025.QĐN-JEMMIA Vv Quy định nguyên tắc và thứ tự ưu tiên áp dụng các chương trình khuyến mãi trong hoạt động kinh doanh ký ngày 28.7.2025.md': {
    label: 'Quy định ưu tiên khuyến mãi',
    larkUrl: '',
  },
  'Quy trình trình duyệt & ban hành các văn bản nội bộ.md': {
    label: 'Quy trình ban hành văn bản',
    larkUrl: '',
  },
  'Sử Dụng Hộp Thư Chung (Public Mailbox).md': {
    label: 'Sử dụng Hộp thư chung',
    larkUrl: '',
  },
  'TB số 112025.TB-JEMMIA vv Ban hành Chính sách sử dụng dịch vụ đặt xe qua ứng dụng công nghệ bằng tài khoản doanh nghiệp ký ngày 27.06.2025.md': {
    label: 'Chính sách sử dụng xe công nghệ',
    larkUrl: '',
  },
  'Thông báo số 012025_TB-JEMMIA-Thông báo chính sách tích-đổi điểm chương trình giới thiệu khách hàng mới.md': {
    label: 'Chính sách tích đổi điểm giới thiệu',
    larkUrl: '',
  },
  'Thông báo số 122025.TB-JEMMIA vv Chấm dứt chính sách nhận ký gửi sản phẩm ký ngày 01.7.2025.md': {
    label: 'Chấm dứt nhận ký gửi sản phẩm',
    larkUrl: '',
  },
  'Thông báo số 132025.TB-JEMMIA V.v Quy định hình thức thanh toán các khoản chi phí từ 5 triệu đồng ký ngày 03.7.2025.md': {
    label: 'Thanh toán chi phí từ 5 triệu',
    larkUrl: '',
  },
  'Thông báo số 152025 TB-JEMMIA vv Thay đổi cách phân bổ giá trị khuyến mãi cho đơn hàng trên hệ thống bán hàng ngày 24.07.2025.md': {
    label: 'Thay đổi phân bổ khuyến mãi',
    larkUrl: '',
  },
  'Thông báo số 162025.TB-JEMMIA V.v Xuất hóa đơn bán hàng đối với hoạt động mua, bán, chế tác vàng, bạc, đá quý ký ngày 05.8.2025.md': {
    label: 'Xuất hóa đơn bán hàng',
    larkUrl: '',
  },
  'Thông báo số 202025.TB-JEMMIA vv Cập nhật chính sách thanh toán cho các đơn hàng (lưu hành nội bộ).md': {
    label: 'Cập nhật chính sách thanh toán',
    larkUrl: '',
  },
  'Thông báo số 212025.TB-JEMMIA vv Sửa đổi, điều chỉnh chính sách thu mua - thu đổi ký ngày 11.11.2025.md': {
    label: 'Sửa đổi chính sách thu đổi',
    larkUrl: '',
  },
  'Thông báo số 22102024.TB.JEMMIA_Thông báo vv Quyết định dừng kinh doanh các sản phẩm không phải là kim cương.md': {
    label: 'Dừng kinh doanh sản phẩm không phải kim cương',
    larkUrl: '',
  },
  'Thông báo số 31052024.TB-JEMMIA_Thông báo về điều chỉnh chính sách thu tiền khách hàng.md': {
    label: 'Điều chỉnh chính sách thu tiền khách hàng',
    larkUrl: '',
  },
};

/** Derived: filename → larkUrl (for backward-compat and getLarkUrlForR2) */
export const R2_TO_LARK_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(JEMMIA_KNOWLEDGE_FILES).map(([filename, { larkUrl }]) => [
    filename.normalize('NFC'),
    larkUrl,
  ]),
);

/** Build the full R2 URL for a knowledge filename */
export const getR2Url = (filename: string): string =>
  `https://${R2_BUCKET_HOST}${R2_KNOWLEDGE_PATH}${encodeURIComponent(filename.normalize('NFC'))}`;

/** Build the jemmia_diamond_knowledge_base bullet list for web browsing systemRole */
export const buildKnowledgeBaseList = (): string =>
  Object.entries(JEMMIA_KNOWLEDGE_FILES)
    .map(([filename, { label, larkUrl }]) => {
      const crawlUrl = getR2Url(filename);
      const citeEntry = larkUrl ? `\n  - cite: ${larkUrl}` : '';
      return `- ${label}\n  - crawl: ${crawlUrl}${citeEntry}`;
    })
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

    const filename = decodeURIComponent(encodedFilename).normalize('NFC');
    const larkUrl = R2_TO_LARK_MAP[filename];
    return larkUrl || null;
  } catch {
    return null;
  }
};
