
import FilterProvider from "@/hooks/filters";
import "../../app/globals.css";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1>Homesss</h1>
      <FilterProvider>{children}</FilterProvider>
    </section>
  );
}
