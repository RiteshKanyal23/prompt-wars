export default function Container({ as: Component = 'div', className = '', children, ...rest }) {
  return (
    <Component className={['container-page', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Component>
  );
}
