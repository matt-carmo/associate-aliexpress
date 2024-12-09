'use client'
import FilterProvider from "@/hooks/filters";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <FilterProvider>{children}</FilterProvider>
    </section>
  );
}
