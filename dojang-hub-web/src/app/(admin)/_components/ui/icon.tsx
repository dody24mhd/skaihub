export type IconProps = {
  name: string;
  className?: string;
};

export default function Icon({ name, className }: IconProps) {
  return (
    <span aria-hidden="true" className={className ? `material-symbols-outlined ${className}` : "material-symbols-outlined"}>
      {name}
    </span>
  );
}
