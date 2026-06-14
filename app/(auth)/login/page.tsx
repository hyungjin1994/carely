import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string }>;
}) {
  const { check } = await searchParams;
  return <LoginForm emailCheck={check === "1"} />;
}
