import { redirect } from "next/navigation";

// proxy 가 "/" 를 역할별 홈으로 보내지만, 직접 도달 시 대비.
export default function RootPage() {
  redirect("/home");
}
