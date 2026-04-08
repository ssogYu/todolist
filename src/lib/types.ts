export type UserSummary = {
  id: string;
  username: string;
};

export type AuthResponse = {
  token: string;
  user: UserSummary;
};

export type TodoItem = {
  id: string;
  content: string;
  isDone: boolean;
  targetDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupListItem = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
};

export type GroupMemberBoard = {
  user: UserSummary;
  todos: TodoItem[];
  completedCount: number;
  totalCount: number;
};

export type GroupBoard = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
  };
  date: string;
  members: GroupMemberBoard[];
};

export type TodosResponse = {
  date: string;
  todos: TodoItem[];
};

export type GroupsResponse = {
  groups: GroupListItem[];
};
