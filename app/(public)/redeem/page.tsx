import { redirect } from "next/navigation";

// 重定向页面不需要 force-dynamic
export default async function RedeemPage() {
  redirect("/");
}
