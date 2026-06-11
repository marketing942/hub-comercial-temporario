import Sidebar, { type SidebarItem } from "./Sidebar";

export default function AppShell({
  role,
  sellerName,
  items,
  children,
}: {
  role: "admin" | "seller";
  sellerName?: string;
  items: SidebarItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="lg:flex">
      <Sidebar role={role} sellerName={sellerName} items={items} />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-[1800px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
