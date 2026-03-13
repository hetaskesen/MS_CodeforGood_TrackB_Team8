import "./globals.css";

export const metadata = {
  title: "Lemontree Insights",
  description: "Data insights platform for food access partners",
  icons: {
    icon: "https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
