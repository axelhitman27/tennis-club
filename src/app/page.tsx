import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";

export default async function Home() {
  const user = await getUser();
  redirect(!user ? "/login" : user.role === "PLAYER" ? "/profile" : user.role === "COACH" ? "/coach/scan" : "/admin");
}
