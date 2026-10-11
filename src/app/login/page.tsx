import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_NAME, COMPANY_NIF } from "@/lib/company";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrlRaw = params?.callbackUrl;
  const callbackUrl =
    (Array.isArray(callbackUrlRaw) ? callbackUrlRaw[0] : callbackUrlRaw) ??
    "/pedidos";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <div className="text-lg font-semibold">{COMPANY_NAME}</div>
        <div className="text-xs text-muted-foreground">{COMPANY_NIF}</div>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
