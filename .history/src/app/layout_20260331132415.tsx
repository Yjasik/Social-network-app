import type { Metadata } from "next"
import "./globals.css"
import Header from "@/src/components/Header"
import { type ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
    title: "Social network",
    description: "Decentralized crowdfunding for innovative projects",
}

export default function RootLayout(props: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-gradient-to-br from-slate-900 to-slate-800">
                <Providers>
                    <Header />
                    {props.children}
                </Providers>
            </body>
        </html>
    )
}