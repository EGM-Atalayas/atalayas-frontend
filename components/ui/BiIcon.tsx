interface BiIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function BiIcon({ name, size = 16, color, className = "" }: BiIconProps) {
  return (
    <i
      className={`bi bi-${name} ${className}`}
      style={{ fontSize: `${size}px`, color: color ?? "currentColor", lineHeight: 1, verticalAlign: "middle", display: "inline-flex", alignItems: "center" }}
    />
  );
}
