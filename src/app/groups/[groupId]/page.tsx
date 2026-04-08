import { AuthGuard } from "@/components/auth-guard";
import { GroupBoardClient } from "@/components/group-board-client";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return (
    <AuthGuard>
      <GroupBoardClient groupId={groupId} />
    </AuthGuard>
  );
}
