import { RegisterForm } from "@/components/register-form"

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-2">
            <div className="rounded-full bg-primary text-primary-foreground p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10" />
                <path d="M7 12h10" />
                <path d="M7 17h10" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold">S.C.H</h1>
          <p className="text-gray-500">Sistema de Controle de Hospedagens</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-gray-500">
          Já possui uma conta?{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            Faça login
          </a>
        </p>
      </div>
    </div>
  )
}
