export function SidebarPanel({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border">{children}</div>;
}

export function SidebarPanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg border-b border-border p-3">{children}</h2>;
}

export function SidebarPanelContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="p-3">{children}</div>;
}
