import { PRODUCT_NAME } from "../brand/identity.js";
import type { ClientSession } from "../session/types.js";

const CONNECTION_LABEL: Record<ClientSession["status"], string> = {
  idle: "idle",
  connecting: "connecting",
  ready: "connected",
  error: "error",
};

export function SettingsPane(props: { readonly session: ClientSession }) {
  const { session } = props;
  const fields = [
    { id: "product", label: "Product", value: PRODUCT_NAME },
    { id: "model", label: "Model", value: session.model || "unset" },
    { id: "connection", label: "Connection", value: CONNECTION_LABEL[session.status] },
    { id: "session", label: "Session", value: session.sessionId ?? "none" },
    { id: "project", label: "Project", value: session.projectId ?? "none" },
  ];

  return (
    <section className="a008-settings" aria-label="A008 settings">
      <h2 className="a008-settings-title">Settings</h2>
      <dl className="a008-settings-list">
        {fields.map((field) => (
          <div key={field.id} className="a008-settings-row" data-field={field.id}>
            <dt>{field.label}</dt>
            <dd>
              {field.id === "connection" ? (
                <span className={`a008-connection a008-connection-${session.status}`}>
                  <span className="a008-connection-dot" aria-hidden="true" />
                  {field.value}
                </span>
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="a008-sidebar-hint">
        Working directory and memory path are omitted from V2 snapshots.
      </p>
    </section>
  );
}
