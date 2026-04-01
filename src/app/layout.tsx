import type { Metadata } from "next"
import "./globals.css"
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
                    {props.children}
                </Providers>
            </body>
        </html>
    )
}