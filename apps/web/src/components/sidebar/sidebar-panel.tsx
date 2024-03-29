export function SidebarPanel({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border">{children}</div>;
}

export function SidebarPanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm border-b border-border px-8 p-3 pt-6 md:px-3">
      {children}
    </h2>
  );
}

export function SidebarPanelContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="p-3 px-8 md:px-3">{children}</div>;
}
