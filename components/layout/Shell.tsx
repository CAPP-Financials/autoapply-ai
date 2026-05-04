import { type ReactNode } from "react";
import { Sidebar, type NavId } from "./Sidebar";
import { Topbar } from "./Topbar";

type Props = {
  active: NavId;
  crumbs: string[];
  topRight?: ReactNode;
  user?: { name: string; resumeMeta?: string };
  configuredProviders?: string[];
  defaultProvider?: string | null;
  cardStyle?: "ledger" | "terminal";
  children: ReactNode;
};

export function Shell({
  active,
  crumbs,
  topRight,
  user,
  configuredProviders,
  defaultProvider,
  cardStyle = "ledger",
  children,
}: Props) {
  return (
    <div className="bg-bg-0 text-fg-0 flex h-screen w-full" data-card-style={cardStyle}>
      <Sidebar
        active={active}
        user={user}
        configuredProviders={configuredProviders}
        defaultProvider={defaultProvider}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar crumbs={crumbs} right={topRight} />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
