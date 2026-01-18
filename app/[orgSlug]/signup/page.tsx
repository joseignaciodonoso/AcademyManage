import { redirect } from "next/navigation"

export default function SignupRedirect({ params }: { params: { orgSlug: string } }) {
  redirect(`/${params.orgSlug}/auth/signup`)
}
