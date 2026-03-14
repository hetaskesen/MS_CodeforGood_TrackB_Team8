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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
