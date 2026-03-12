import { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account — Momento",
  description: "Create your Momento account to start sharing event photos",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
