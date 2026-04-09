## API

- auth/login - 登录接口

```
参数
    req：
        {
            username: string, //z.string().trim().min(3).max(24)
            password: "123456",//z.string().min(6).max(64)
        }
    res:
        {
            token: string,
            user: {
                id: number,
                username: string,
            }
        }

```

- auth/register - 注册

```
参数
    req：
        {
            username: string, //z.string().trim().min(3).max(24)
            password: "123456",//z.string().min(6).max(64)
        }
    res:
        {
            token: string,
            user: {
                id: number,
                username: string,
            }
        }

```

- me - 获取当前用户信息

```
参数
    res:
        {
            id: number,
            username: string,
        }

```

- /groups -获取用户所有群组

```
参数
    res:
        [
            {
                id: string;
                name: string;
                inviteCode: string;
                memberCount: number;
            }
        ]

```

- /groups/join -加入群组

```
    req:
        {
          inviteCode:string, //z.string().trim().min(6).max(12
        }
    res:
        {
            id: string;
            name: string;
            inviteCode: string;
            memberCount: number;
        }
```

- /groups/:groupId?date=date -获取群组详情

```
参数
    res:
        {
            group: {
                id: string;
                name: string;
                inviteCode: string;
            },
            date: string,
            members:[
                {
                    user: {
                        id: number,
                        username: string,
                    },
                    todos:[
                        {
                            id: string;
                            content: string;
                            note: string | null;
                            category: "WORK" | "PERSONAL";
                            isDone: boolean;
                            targetDate: Date;
                            userId: string;
                            createdAt: Date;
                            updatedAt: Date;
                        }
                    ],
                    completedCount: number,
                    totalCount: number
                }
            ]
        }
```

- /groups/:groupId:date (get)-获取群组sse事件实时获取

- /todos?date=date -获取用户所有待办事项

```
    res
        {
            date:string;
            todos:[
                {
                    id: string;
                    content: string;
                    note: string | null;
                    category: "WORK" | "PERSONAL";
                    isDone: boolean;
                    targetDate: Date;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
                }
            ]
        }

```

- /todos (post)-创建待办事项

```
    req
        {
            content: z.string().trim().min(1).max(140),
            note: z.string().trim().max(500).optional(),
            category: z.enum(["WORK", "PERSONAL"]).default("WORK"),
            targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        }
    res
        {
            id: string;
            content: string;
            note: string | null;
            category: "WORK" | "PERSONAL";
            isDone: boolean;
            targetDate: Date;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
        }
```

- /todos/todoId -更新待办事项

```
    req
        {
            content: z.string().trim().min(1).max(140).optional(),
            note: z.string().trim().max(500).optional(),
            category: z.enum(["WORK", "PERSONAL"]).optional(),
            isDone: z.boolean().optional(),
            targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        }

    res
        {
            id: string;
            content: string;
            note: string | null;
            category: "WORK" | "PERSONAL";
            isDone: boolean;
            targetDate: Date;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
        }

```
