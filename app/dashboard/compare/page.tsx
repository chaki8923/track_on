import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CompareClient from "./CompareClient";

export default async function ComparePage() {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // ユーザーのサイト一覧を取得
  const { data: sites } = await supabase
    .from("monitored_sites")
    .select("id, name, url")
    .eq("user_id", session.user.id)
    .order("name");

  return (
    <CompareClient
      user={session.user}
      sites={sites || []}
    />
  );
}
