export function Container({ children, className = '', wide = false, ...props }) {
  return (
    <div className={`mx-auto px-5 sm:px-6 lg:px-8 ${wide ? 'max-w-[1440px]' : 'max-w-[1280px]'} ${className}`} {...props}>
      {children}
    </div>
  );
}
export default Container;
