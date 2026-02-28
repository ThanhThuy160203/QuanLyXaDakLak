import { RoleKey } from '../types';

export type CapabilityItem = {
  title: string;
  bullets?: string[];
};

export type CapabilitySection = {
  title: string;
  items: CapabilityItem[];
};

export const ROLE_CAPABILITY_SECTIONS: Partial<Record<RoleKey, CapabilitySection[]>> = {
  EMPLOYEE: [
    {
      title: 'Quyền nhiệm vụ',
      items: [
        { title: 'Nhận nhiệm vụ được giao' },
        { title: 'Xác nhận đã nhận nhiệm vụ' },
        { title: 'Cập nhật tiến độ thường xuyên' },
        { title: 'Gửi phản hồi hoặc giải trình' },
        { title: 'Xác nhận hoàn thành nhiệm vụ' },
      ],
    },
    {
      title: 'Theo dõi & Báo cáo',
      items: [
        {
          title: 'Xem kết quả cá nhân',
          bullets: ['Tổng số nhiệm vụ', 'Hoàn thành đúng hạn', 'Hoàn thành trễ', 'Đang xử lý', 'Quá hạn'],
        },
        { title: 'Xuất báo cáo chi tiết công việc' },
      ],
    },
    {
      title: 'Bộ lọc chuẩn',
      items: [
        { title: 'Theo thời gian', bullets: ['Tháng', 'Quý', 'Năm'] },
        { title: 'Theo trạng thái', bullets: ['Quá hạn', 'Sắp đến hạn', 'Đã hoàn thành', 'Toàn bộ'] },
      ],
    },
    {
      title: 'Nhận thông báo',
      items: [
        { title: 'Cảnh báo ngay khi đăng nhập' },
        { title: 'Nhắc việc quá hạn' },
        { title: 'Nhắc việc sắp đến hạn' },
      ],
    },
  ],
  DEPARTMENT_HEAD: [
    {
      title: 'Quyền nhiệm vụ',
      items: [
        { title: 'Nhận nhiệm vụ từ Chủ tịch' },
        { title: 'Nhận nhiệm vụ từ Phó Chủ tịch' },
        { title: 'Giao nhiệm vụ cho nhân viên' },
        { title: 'Giao lại nhiệm vụ cho nhân viên khác trong phòng' },
        { title: 'Phản hồi kết quả lên cấp trên' },
        { title: 'Đánh giá mức độ hoàn thành của nhân viên' },
      ],
    },
    {
      title: 'Báo cáo & Theo dõi',
      items: [
        { title: 'Xem kết quả', bullets: ['Từng nhân viên', 'Tổng phòng'] },
        { title: 'Xuất báo cáo', bullets: ['Theo nhân viên', 'Theo phòng'] },
        { title: 'Sử dụng bộ lọc giống cấp Nhân viên' },
      ],
    },
    {
      title: 'Xếp hạng & Cảnh báo',
      items: [
        { title: 'Xếp hạng nhân viên trong phòng' },
        { title: 'Xếp hạng phòng ban trong toàn hệ thống' },
        { title: 'Nhận cảnh báo nhân viên có mức hoàn thành thấp' },
        { title: 'Nhận thông tin nhân viên xuất sắc' },
      ],
    },
    {
      title: 'Thông báo bổ sung',
      items: [
        { title: 'Nhận cảnh báo nhiệm vụ giống cấp Nhân viên' },
        { title: 'Nhận cảnh báo phòng có tỷ lệ hoàn thành thấp' },
      ],
    },
  ],
  DEPUTY_CHAIR: [
    {
      title: 'Quyền kế thừa',
      items: [{ title: 'Sở hữu toàn bộ quyền của cấp Trưởng phòng' }],
    },
    {
      title: 'Mở rộng quyền điều phối',
      items: [
        { title: 'Quản lý nhiều phòng ban cùng lúc' },
        { title: 'Liên thông nhiệm vụ giữa các phòng được phân công' },
        { title: 'Xem báo cáo của từng phòng và so sánh theo thời gian thực' },
        { title: 'Tổng hợp kết quả toàn khu vực phụ trách' },
      ],
    },
    {
      title: 'Giao nhiệm vụ',
      items: [
        { title: 'Giao nhiệm vụ xuống Trưởng phòng' },
        { title: 'Giao trực tiếp cho nhân viên (khi cần)' },
      ],
    },
  ],
  CHAIRMAN: [
    {
      title: 'Quyền nhiệm vụ',
      items: [
        { title: 'Thêm mới nhiệm vụ' },
        { title: 'Giao nhiệm vụ cho Phó Chủ tịch, Trưởng phòng hoặc Nhân viên' },
        { title: 'Giao lại nhiệm vụ khi cần thay đổi' },
        { title: 'Hủy nhiệm vụ không còn phù hợp' },
      ],
    },
    {
      title: 'Dashboard toàn hệ thống',
      items: [
        { title: 'Theo dõi kết quả toàn xã' },
        { title: 'Xem tỷ lệ hoàn thành theo từng cấp (Phó Chủ tịch, Trưởng phòng, Nhân viên)' },
        { title: 'Giám sát tỷ lệ hoàn thành chung của hệ thống' },
      ],
    },
    {
      title: 'Phân tích & Báo cáo',
      items: [
        { title: 'Phân tích theo phòng, cá nhân và thời gian' },
        { title: 'Xuất báo cáo theo phòng, cá nhân, cấp và thời gian' },
        { title: 'So sánh hiệu suất các phòng ban' },
      ],
    },
    {
      title: 'Quyền kế thừa',
      items: [{ title: 'Có toàn bộ quyền của các cấp dưới' }],
    },
  ],
  AGGREGATOR: [
    {
      title: 'Dashboard và báo cáo',
      items: [
        { title: 'Dashboard tương đương cấp Chủ tịch' },
        { title: 'Xuất báo cáo toàn hệ thống' },
      ],
    },
    {
      title: 'Quyền nhiệm vụ',
      items: [
        { title: 'Thêm nhiệm vụ' },
        { title: 'Giao nhiệm vụ cho các cấp dưới' },
        { title: 'Hủy nhiệm vụ khi cần' },
      ],
    },
    {
      title: 'Phân loại nguồn giao nhiệm vụ',
      items: [
        {
          title: 'Sử dụng trường source_type trong cơ sở dữ liệu',
          bullets: ['SO', 'BAN_NGANH', 'UBND_TINH', 'CHU_TICH', 'NOI_BO'],
        },
        { title: 'Theo dõi, phân tích và lọc nhiệm vụ theo từng nguồn' },
      ],
    },
  ],
};
