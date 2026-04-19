import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import { Inter, Playfair_Display, Poppins, Raleway } from "next/font/google";

const inter    = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const poppins  = Poppins({
  subsets:  ["latin"],
  weight:   ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});
const raleway  = Raleway({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800", "900"],
  variable: "--font-raleway",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${poppins.variable} ${raleway.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
