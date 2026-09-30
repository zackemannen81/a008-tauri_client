export function WaitingSurface(props: {
  readonly title: string;
  readonly detail: string;
}) {
  return (
    <div className="a008-capability">
      <strong>{props.title}</strong>
      <p>{props.detail}</p>
    </div>
  );
}
