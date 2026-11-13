export default function AuthLayout({ children }: LayoutProps<"/login">) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}
