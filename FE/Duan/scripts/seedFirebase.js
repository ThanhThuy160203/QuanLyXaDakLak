'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const firestoreConfig = require('../src/config/firestore.config.json');

const DEFAULT_SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  '../serviceAccountKey.json',
);
const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT || DEFAULT_SERVICE_ACCOUNT_PATH;
const SAMPLE_PASSWORD = process.env.SAMPLE_ACCOUNT_PASSWORD || '12345678';
const TASKS_COLLECTION = firestoreConfig.tasksCollectionPath || 'tasks';
const USERS_COLLECTION = firestoreConfig.usersCollectionPath || 'users';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `Không tìm thấy service account JSON. Đặt đường dẫn vào biến FIREBASE_SERVICE_ACCOUNT hoặc tạo file ${DEFAULT_SERVICE_ACCOUNT_PATH}.`,
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
const auth = admin.auth();
const { FieldValue } = admin.firestore;

const relativeIso = (offsetDays = 0) => {
  const result = new Date();
  result.setDate(result.getDate() + offsetDays);
  return result.toISOString();
};

const SAMPLE_USERS = [
  {
    email: 'nhanvien@duan.gov.vn',
    displayName: 'Nguyễn Văn Minh',
    role: 'EMPLOYEE',
    department: 'Văn phòng',
  },
  {
    email: 'truongphong@duan.gov.vn',
    displayName: 'Trần Thị Mai',
    role: 'DEPARTMENT_HEAD',
    department: 'Tư pháp',
    managedDepartments: ['Tư pháp'],
  },
  {
    email: 'phoct@duan.gov.vn',
    displayName: 'Lê Quốc Bảo',
    role: 'DEPUTY_CHAIR',
    managedDepartments: ['Tư pháp', 'Kinh tế'],
  },
  {
    email: 'chutich@duan.gov.vn',
    displayName: 'Phạm Hữu Thành',
    role: 'CHAIRMAN',
  },
  {
    email: 'tonghop@duan.gov.vn',
    displayName: 'Đỗ Gia Hưng',
    role: 'AGGREGATOR',
  },
];

const SAMPLE_TASKS = [
  {
    id: 'T-001',
    title: 'Hoàn thiện báo cáo cải cách hành chính',
    description: 'Tổng hợp số liệu và phản hồi theo biểu mẫu của Sở Nội vụ.',
    ownerRole: 'AGGREGATOR',
    assigneeRole: 'DEPARTMENT_HEAD',
    assigneeName: 'Trần Thị Mai',
    department: 'Tư pháp',
    source: 'SO',
    status: 'IN_PROGRESS',
    progress: 64,
    attachments: 3,
    dueOffsetDays: 3,
  },
  {
    id: 'T-002',
    title: 'Rà soát hồ sơ đất đai tồn đọng',
    description: 'Xử lý hồ sơ quá hạn và gửi báo cáo kết quả cho UBND tỉnh.',
    ownerRole: 'CHAIRMAN',
    assigneeRole: 'DEPUTY_CHAIR',
    assigneeName: 'Lê Quốc Bảo',
    department: 'Tài nguyên',
    source: 'UBND_TINH',
    status: 'REVIEW',
    progress: 82,
    dueOffsetDays: -2,
  },
  {
    id: 'T-003',
    title: 'Tổ chức tuyên truyền pháp luật quý I',
    description: 'Chuẩn bị nội dung và lịch triển khai đến từng phòng ban.',
    ownerRole: 'DEPARTMENT_HEAD',
    assigneeRole: 'EMPLOYEE',
    assigneeName: 'Nguyễn Văn Minh',
    department: 'Tư pháp',
    source: 'NOI_BO',
    status: 'IN_PROGRESS',
    progress: 45,
    dueOffsetDays: 9,
  },
  {
    id: 'T-004',
    title: 'Thẩm định hồ sơ đầu tư dự án X',
    description: 'Phối hợp phòng Kinh tế và UBND huyện hoàn tất thẩm định.',
    ownerRole: 'DEPUTY_CHAIR',
    assigneeRole: 'DEPARTMENT_HEAD',
    assigneeName: 'Trần Thị Mai',
    department: 'Kinh tế',
    source: 'UBND_TINH',
    status: 'NEW',
    progress: 10,
    dueOffsetDays: 1,
  },
  {
    id: 'T-006',
    title: 'Tổng hợp KPI quý gần nhất',
    description: 'Phòng Tổng hợp gửi báo cáo KPI lên Chủ tịch.',
    ownerRole: 'CHAIRMAN',
    assigneeRole: 'AGGREGATOR',
    assigneeName: 'Đỗ Gia Hưng',
    department: 'Tổng hợp',
    source: 'CHU_TICH',
    status: 'IN_PROGRESS',
    progress: 58,
    dueOffsetDays: -1,
  },
  {
    id: 'T-007',
    title: 'Kiểm tra công tác chuẩn bị mùa mưa bão',
    description: 'Trưởng phòng giao nhân viên hoàn tất checklist.',
    ownerRole: 'DEPARTMENT_HEAD',
    assigneeRole: 'EMPLOYEE',
    assigneeName: 'Nguyễn Văn Minh',
    department: 'Kinh tế',
    source: 'UBND_HUYEN',
    status: 'NEW',
    progress: 0,
    dueOffsetDays: -5,
  },
  {
    id: 'T-008',
    title: 'Đánh giá mức hoàn thành nhân viên phòng Tư pháp',
    description: 'Trưởng phòng tổng hợp kết quả theo từng nhiệm vụ.',
    ownerRole: 'DEPARTMENT_HEAD',
    assigneeRole: 'DEPARTMENT_HEAD',
    assigneeName: 'Trần Thị Mai',
    department: 'Tư pháp',
    source: 'NOI_BO',
    status: 'REVIEW',
    progress: 72,
    dueOffsetDays: 6,
  },
  {
    id: 'T-009',
    title: 'Chuẩn hóa số liệu chuyên đề du lịch',
    description: 'Phối hợp Ban Du lịch cập nhật các biểu mẫu và quy chế.',
    ownerRole: 'AGGREGATOR',
    assigneeRole: 'DEPARTMENT_HEAD',
    assigneeName: 'Trần Thị Mai',
    department: 'Văn hóa',
    source: 'BAN_NGANH',
    status: 'IN_PROGRESS',
    progress: 55,
    dueOffsetDays: 4,
  },
];

const buildTaskDocument = task => {
  const { dueOffsetDays, attachments, ...rest } = task;
  const payload = {
    ...rest,
    dueDate: relativeIso(dueOffsetDays),
    progress: typeof rest.progress === 'number' ? rest.progress : 0,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (typeof attachments === 'number') {
    payload.attachments = attachments;
  }
  return payload;
};

const syncUserProfile = async (uid, user, isNew) => {
  const docRef = firestore.collection(USERS_COLLECTION).doc(uid);
  const basePayload = {
    uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    department: user.department || null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (user.managedDepartments?.length) {
    basePayload.managedDepartments = user.managedDepartments;
  }
  if (isNew) {
    basePayload.createdAt = FieldValue.serverTimestamp();
  }
  await docRef.set(basePayload, { merge: true });
};

const seedUsers = async () => {
  for (const user of SAMPLE_USERS) {
    try {
      const existing = await auth.getUserByEmail(user.email);
      await auth.updateUser(existing.uid, {
        displayName: user.displayName,
        password: SAMPLE_PASSWORD,
      });
      await syncUserProfile(existing.uid, user, false);
      console.log(`[auth] Đã đồng bộ ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        const created = await auth.createUser({
          email: user.email,
          password: SAMPLE_PASSWORD,
          displayName: user.displayName,
        });
        await syncUserProfile(created.uid, user, true);
        console.log(`[auth] Đã tạo ${user.email}`);
        continue;
      }
      throw error;
    }
  }
};

const seedTasks = async () => {
  for (const task of SAMPLE_TASKS) {
    const docRef = firestore.collection(TASKS_COLLECTION).doc(task.id);
    const snapshot = await docRef.get();
    const payload = buildTaskDocument(task);
    if (!snapshot.exists) {
      payload.createdAt = FieldValue.serverTimestamp();
    }
    await docRef.set(payload, { merge: true });
    console.log(`[tasks] Đã cập nhật ${task.id}`);
  }
};

const main = async () => {
  console.log('Bắt đầu seed Firebase...');
  await seedUsers();
  await seedTasks();
  console.log('Hoàn tất seed Firebase.');
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Seed thất bại:', error);
    process.exit(1);
  });
