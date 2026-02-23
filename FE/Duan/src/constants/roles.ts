import { RoleDefinition, RoleKey } from '../types';

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    key: 'EMPLOYEE',
    label: 'Nhân viên',
    description:
      'Nhận và phản hồi nhiệm vụ, cập nhật kết quả cá nhân và gửi báo cáo chi tiết.',
    scope: 'PERSONAL',
    capabilities: [
      'Nhận nhiệm vụ và xác nhận hoàn thành',
      'Tra cứu kết quả cá nhân theo nhiều bộ lọc',
      'Nhận thông báo và cảnh báo quá hạn/sắp đến hạn'
    ],
    escalatesTo: ['DEPARTMENT_HEAD'],
    assignsTo: [],
  },
  {
    key: 'DEPARTMENT_HEAD',
    label: 'Trưởng phòng',
    description:
      'Tiếp nhận nhiệm vụ cấp trên, phân công cho nhân viên và đánh giá kết quả phòng.',
    scope: 'DEPARTMENT',
    capabilities: [
      'Giao nhiệm vụ cho nhân viên hoặc chuyển phòng',
      'Đánh giá, phản hồi nhiệm vụ của nhân viên',
      'Xuất báo cáo chi tiết cấp phòng và nhân viên',
      'Xếp hạng nhân viên và phòng ban'
    ],
    escalatesTo: ['DEPUTY_CHAIR'],
    assignsTo: ['EMPLOYEE'],
  },
  {
    key: 'DEPUTY_CHAIR',
    label: 'Phó Chủ tịch',
    description:
      'Điều phối nhiều phòng ban, giao nhiệm vụ đa phòng và theo dõi báo cáo cấp cao.',
    scope: 'CROSS_DEPARTMENT',
    capabilities: [
      'Liên thông các phòng được phân công',
      'Xem báo cáo tổng hợp các phòng phụ trách',
      'Giao nhiệm vụ xuống trưởng phòng hoặc nhân viên'
    ],
    escalatesTo: ['CHAIRMAN'],
    assignsTo: ['DEPARTMENT_HEAD', 'EMPLOYEE'],
  },
  {
    key: 'CHAIRMAN',
    label: 'Chủ tịch',
    description:
      'Quyền cao nhất, giao nhiệm vụ đa cấp với dashboard tổng thể toàn xã.',
    scope: 'CITY',
    capabilities: [
      'Giao nhiệm vụ tới mọi cấp',
      'Theo dõi dashboard tổng thể toàn xã',
      'Hủy hoặc chuyển nhiệm vụ',
      'Truy xuất báo cáo theo phòng hoặc cá nhân'
    ],
    assignsTo: ['DEPUTY_CHAIR', 'DEPARTMENT_HEAD', 'EMPLOYEE'],
  },
  {
    key: 'AGGREGATOR',
    label: 'Tổng hợp',
    description:
      'Thêm và phân loại nhiệm vụ theo nguồn giao, xuất báo cáo tương tự Chủ tịch.',
    scope: 'CROSS_DEPARTMENT',
    capabilities: [
      'Thêm/giao/hủy nhiệm vụ',
      'Phân loại nguồn giao nhiệm vụ',
      'Xuất báo cáo đa chiều'
    ],
    assignsTo: ['DEPUTY_CHAIR', 'DEPARTMENT_HEAD', 'EMPLOYEE'],
  },
  {
    key: 'ADMIN',
    label: 'Admin',
    description:
      'Quản trị hệ thống, reset mật khẩu và gán phân cấp phòng ban.',
    scope: 'CROSS_DEPARTMENT',
    capabilities: [
      'Thêm/xóa/điều chỉnh tài khoản',
      'Phân chia phòng ban và quan hệ quản lý',
      'Có mọi quyền cấp dưới'
    ],
    assignsTo: ['CHAIRMAN', 'DEPUTY_CHAIR', 'DEPARTMENT_HEAD', 'EMPLOYEE'],
  },
];

export const ROLE_MAP = ROLE_DEFINITIONS.reduce<Record<RoleKey, RoleDefinition>>(
  (acc, role) => {
    acc[role.key] = role;
    return acc;
  },
  {} as Record<RoleKey, RoleDefinition>
);

export const ROLE_DIRECTORY: Record<
  string,
  {
    role: RoleKey;
    displayName: string;
    department?: string;
    managedDepartments?: string[];
  }
> = {
  'nhanvien@duan.gov.vn': {
    role: 'EMPLOYEE',
    displayName: 'Nguyễn Văn Minh',
    department: 'Văn phòng',
  },
  'truongphong@duan.gov.vn': {
    role: 'DEPARTMENT_HEAD',
    displayName: 'Trần Thị Mai',
    department: 'Tư pháp',
    managedDepartments: ['Tư pháp'],
  },
  'phoct@duan.gov.vn': {
    role: 'DEPUTY_CHAIR',
    displayName: 'Lê Quốc Bảo',
    managedDepartments: ['Tư pháp', 'Kinh tế'],
  },
  'chutich@duan.gov.vn': {
    role: 'CHAIRMAN',
    displayName: 'Phạm Hữu Thành',
  },
  'tonghop@duan.gov.vn': {
    role: 'AGGREGATOR',
    displayName: 'Đỗ Gia Hưng',
  },
  'admin@duan.gov.vn': {
    role: 'ADMIN',
    displayName: 'Admin Hệ thống',
  },
};

export const DEFAULT_ROLE: RoleKey = 'EMPLOYEE';

export const ROLE_ORDER: RoleKey[] = [
  'EMPLOYEE',
  'DEPARTMENT_HEAD',
  'DEPUTY_CHAIR',
  'AGGREGATOR',
  'CHAIRMAN',
  'ADMIN',
];
