export default function Card({ as: Component = 'div', padded = false, className = '', children, ...rest }) {
  const classes = ['card', padded ? 'card-pad' : '', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
