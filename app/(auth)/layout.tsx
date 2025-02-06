import { AuthHeader } from "../../components/auth-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthHeader />
      <main className="pt-12">
        {children}
      </main>
    </>
  )
}