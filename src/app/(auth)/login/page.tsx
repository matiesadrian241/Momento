import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — Momento",
  description: "Sign in to your Momento account",
};

export default function LoginPage() {
  return <LoginForm />;
}
