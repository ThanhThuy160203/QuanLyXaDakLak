import firestoreConfigJson from './firestore.config.json';

type FirestoreConfig = {
  projectId: string;
  databaseId: string;
  tasksCollectionPath: string;
  usersCollectionPath?: string;
};

export const firestoreConfig: FirestoreConfig = firestoreConfigJson;
