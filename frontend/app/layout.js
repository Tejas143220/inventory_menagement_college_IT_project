import "./globals.css"

export const metadata = {
  title: "FLY ASH BRICKS",
  description: "FLY ASH BRICKS Inventory Management",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
