import { AuthCard } from "@/components/auth-card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#08131f_0%,_#102235_100%)] px-6 py-20">
      <AuthCard
        title="Create your GymFlow account"
        description="Use this screen for the public member onboarding flow or invite staff manually after Supabase auth is configured."
        footerLabel="Back to sign in"
        footerHref="/sign-in"
        footerText="Already have access?"
      />
    </div>
  );
}
