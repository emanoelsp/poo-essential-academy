import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { SettingsProvider } from "@/contexts/SettingsContext"
import { Header } from "@/components/shared/Header"
import { XPToastListener } from "@/components/features/gamification/XPToast"
import { ProgressSync } from "@/components/features/gamification/ProgressSync"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "POO Academy — Programação Orientada a Objetos em Java",
  description: "Curso completo de POO em Java com UML, gamificação e exercícios práticos.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <SettingsProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <Toaster position="bottom-right" />
            <XPToastListener />
            <ProgressSync />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
