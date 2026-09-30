import { useState, type ReactNode } from "react";

export interface WorkbenchSurface {
  readonly id: string;
  readonly label: string;
  readonly render: () => ReactNode;
}

export function Workbench(props: {
  readonly surfaces: readonly WorkbenchSurface[];
  readonly label: string;
  readonly selectedId?: string;
  readonly onSelect?: (id: string) => void;
}) {
  const first = props.surfaces[0];
  const [internalId, setInternalId] = useState(first?.id);
  const selectedId = props.selectedId ?? internalId;
  const selected = props.surfaces.find((surface) => surface.id === selectedId) ?? first;

  if (first === undefined) return null;

  return (
    <section className="a008-workbench" aria-label={props.label}>
      <div className="a008-workbench-tabs" role="tablist" aria-label={props.label}>
        {props.surfaces.map((surface) => (
          <button
            key={surface.id}
            type="button"
            role="tab"
            id={`a008-workbench-tab-${surface.id}`}
            aria-selected={surface.id === selected?.id}
            aria-controls={`a008-workbench-pane-${surface.id}`}
            className="a008-workbench-tab"
            onClick={() => {
              setInternalId(surface.id);
              props.onSelect?.(surface.id);
            }}
          >
            {surface.label}
          </button>
        ))}
      </div>
      {selected === undefined ? null : (
        <div
          className="a008-workbench-pane"
          role="tabpanel"
          id={`a008-workbench-pane-${selected.id}`}
          aria-labelledby={`a008-workbench-tab-${selected.id}`}
        >
          {selected.render()}
        </div>
      )}
    </section>
  );
}
