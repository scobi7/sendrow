import { redirect } from "next/navigation";

export default async function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/consultant/clients/${id}/manage/scope1`);
}
